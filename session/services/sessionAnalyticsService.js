import SessionEvent from "../models/SessionEvent.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePagination(page, limit) {
  const pageNum = Math.max(DEFAULT_PAGE, parseInt(page, 10) || DEFAULT_PAGE);
  const limitNum = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT)
  );

  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };
}

function buildDateMatch(from, to) {
  if (!from && !to) return null;

  const createdAt = {};
  if (from) createdAt.$gte = new Date(from);
  if (to) createdAt.$lte = new Date(to);

  return createdAt;
}

function normalizeResult(payload = {}) {
  const raw = payload.result ?? payload.outcome ?? null;
  if (!raw) return "UNKNOWN";

  const value = String(raw).toUpperCase();
  if (["WIN", "WON", "WINNER"].includes(value)) return "WIN";
  if (["LOSS", "LOSE", "LOST", "LOSER"].includes(value)) return "LOSS";
  if (["DRAW", "TIE"].includes(value)) return "DRAW";
  return value;
}

function roundEndedLookupStages() {
  return [
    {
      $lookup: {
        from: "sessions",
        localField: "sessionId",
        foreignField: "_id",
        as: "session",
      },
    },
    { $unwind: "$session" },
  ];
}

function buildRoundEndedBaseMatch({ from, to }) {
  const match = { event: "ROUND_ENDED" };
  const createdAt = buildDateMatch(from, to);
  if (createdAt) match.createdAt = createdAt;
  return match;
}

function summarizeResults(rows = []) {
  const summary = {
    totalRounds: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    unknown: 0,
    totalPayout: 0,
    totalBet: 0,
  };

  for (const row of rows) {
    const count = row.count ?? 0;
    summary.totalRounds += count;

    if (row.result === "WIN") summary.wins += count;
    else if (row.result === "LOSS") summary.losses += count;
    else if (row.result === "DRAW") summary.draws += count;
    else summary.unknown += count;

    summary.totalPayout += row.totalPayout ?? 0;
    summary.totalBet += row.totalBet ?? 0;
  }

  return summary;
}

function formatRoundResultRow(doc) {
  const payload = doc.payload ?? {};
  const result = normalizeResult(payload);

  return {
    eventId: doc._id.toString(),
    sessionId: doc.sessionId.toString(),
    operatorId: doc.session.operatorId,
    gameCode: doc.session.gameCode,
    playerId: doc.session.playerId,
    playerUsername: doc.session.playerUsername,
    currency: doc.session.currency,
    event: doc.event,
    roundId: payload.roundId ?? null,
    tableId: payload.tableId ?? doc.session.gameContext?.tableId ?? null,
    result,
    payout: payload.payout ?? null,
    betAmount: payload.betAmount ?? null,
    payload,
    createdAt: doc.createdAt.toISOString(),
  };
}

async function aggregatePlayerBreakdown(sessionMatch, { from, to } = {}) {
  const rows = await SessionEvent.aggregate([
    { $match: buildRoundEndedBaseMatch({ from, to }) },
    ...roundEndedLookupStages(),
    { $match: sessionMatch },
    {
      $addFields: {
        normalizedResult: {
          $let: {
            vars: {
              raw: {
                $toUpper: {
                  $ifNull: ["$payload.result", "$payload.outcome"],
                },
              },
            },
            in: {
              $switch: {
                branches: [
                  {
                    case: { $in: ["$$raw", ["WIN", "WON", "WINNER"]] },
                    then: "WIN",
                  },
                  {
                    case: { $in: ["$$raw", ["LOSS", "LOSE", "LOST", "LOSER"]] },
                    then: "LOSS",
                  },
                  {
                    case: { $in: ["$$raw", ["DRAW", "TIE"]] },
                    then: "DRAW",
                  },
                ],
                default: {
                  $ifNull: ["$$raw", "UNKNOWN"],
                },
              },
            },
          },
        },
        payoutValue: { $ifNull: ["$payload.payout", 0] },
        betValue: { $ifNull: ["$payload.betAmount", 0] },
      },
    },
    {
      $group: {
        _id: {
          playerId: "$session.playerId",
          playerUsername: "$session.playerUsername",
          result: "$normalizedResult",
        },
        count: { $sum: 1 },
        totalPayout: { $sum: "$payoutValue" },
        totalBet: { $sum: "$betValue" },
      },
    },
    {
      $group: {
        _id: {
          playerId: "$_id.playerId",
          playerUsername: "$_id.playerUsername",
        },
        wins: {
          $sum: {
            $cond: [{ $eq: ["$_id.result", "WIN"] }, "$count", 0],
          },
        },
        losses: {
          $sum: {
            $cond: [{ $eq: ["$_id.result", "LOSS"] }, "$count", 0],
          },
        },
        draws: {
          $sum: {
            $cond: [{ $eq: ["$_id.result", "DRAW"] }, "$count", 0],
          },
        },
        unknown: {
          $sum: {
            $cond: [
              {
                $in: ["$_id.result", ["WIN", "LOSS", "DRAW"]],
              },
              0,
              "$count",
            ],
          },
        },
        totalRounds: { $sum: "$count" },
        totalPayout: { $sum: "$totalPayout" },
        totalBet: { $sum: "$totalBet" },
      },
    },
    { $sort: { totalRounds: -1 } },
  ]);

  return rows.map((row) => ({
    playerId: row._id.playerId,
    playerUsername: row._id.playerUsername,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    unknown: row.unknown,
    totalRounds: row.totalRounds,
    totalPayout: row.totalPayout,
    totalBet: row.totalBet,
    netPayout: row.totalPayout - row.totalBet,
  }));
}

function buildSessionMatch({ operatorId, gameCode }) {
  const match = {};
  if (operatorId) match["session.operatorId"] = operatorId;
  if (gameCode) match["session.gameCode"] = gameCode;
  return match;
}

export async function getStatsByOperator({ operatorId, gameCode, from, to }) {
  if (!operatorId) {
    return { valid: false, status: 400, message: "operatorId is required" };
  }

  const sessionMatch = buildSessionMatch({ operatorId, gameCode });
  const eventMatch = buildRoundEndedBaseMatch({ from, to });

  const [summaryRows, byPlayer] = await Promise.all([
    SessionEvent.aggregate([
      { $match: eventMatch },
      ...roundEndedLookupStages(),
      { $match: sessionMatch },
      {
        $addFields: {
          normalizedResult: {
            $let: {
              vars: {
                raw: {
                  $toUpper: {
                    $ifNull: ["$payload.result", "$payload.outcome"],
                  },
                },
              },
              in: {
                $switch: {
                  branches: [
                    {
                      case: { $in: ["$$raw", ["WIN", "WON", "WINNER"]] },
                      then: "WIN",
                    },
                    {
                      case: {
                        $in: ["$$raw", ["LOSS", "LOSE", "LOST", "LOSER"]],
                      },
                      then: "LOSS",
                    },
                    {
                      case: { $in: ["$$raw", ["DRAW", "TIE"]] },
                      then: "DRAW",
                    },
                  ],
                  default: { $ifNull: ["$$raw", "UNKNOWN"] },
                },
              },
            },
          },
          payoutValue: { $ifNull: ["$payload.payout", 0] },
          betValue: { $ifNull: ["$payload.betAmount", 0] },
        },
      },
      {
        $group: {
          _id: "$normalizedResult",
          count: { $sum: 1 },
          totalPayout: { $sum: "$payoutValue" },
          totalBet: { $sum: "$betValue" },
        },
      },
    ]),
    aggregatePlayerBreakdown(sessionMatch, { from, to }),
  ]);

  return {
    valid: true,
    filters: { operatorId, gameCode: gameCode ?? null, from: from ?? null, to: to ?? null },
    summary: summarizeResults(
      summaryRows.map((row) => ({
        result: row._id,
        count: row.count,
        totalPayout: row.totalPayout,
        totalBet: row.totalBet,
      }))
    ),
    byPlayer,
  };
}

export async function getStatsByGame({ gameCode, operatorId, from, to }) {
  if (!gameCode) {
    return { valid: false, status: 400, message: "gameCode is required" };
  }

  const sessionMatch = buildSessionMatch({ operatorId, gameCode });
  const eventMatch = buildRoundEndedBaseMatch({ from, to });

  const [summaryRows, byPlayer] = await Promise.all([
    SessionEvent.aggregate([
      { $match: eventMatch },
      ...roundEndedLookupStages(),
      { $match: sessionMatch },
      {
        $addFields: {
          normalizedResult: {
            $let: {
              vars: {
                raw: {
                  $toUpper: {
                    $ifNull: ["$payload.result", "$payload.outcome"],
                  },
                },
              },
              in: {
                $switch: {
                  branches: [
                    {
                      case: { $in: ["$$raw", ["WIN", "WON", "WINNER"]] },
                      then: "WIN",
                    },
                    {
                      case: {
                        $in: ["$$raw", ["LOSS", "LOSE", "LOST", "LOSER"]],
                      },
                      then: "LOSS",
                    },
                    {
                      case: { $in: ["$$raw", ["DRAW", "TIE"]] },
                      then: "DRAW",
                    },
                  ],
                  default: { $ifNull: ["$$raw", "UNKNOWN"] },
                },
              },
            },
          },
          payoutValue: { $ifNull: ["$payload.payout", 0] },
          betValue: { $ifNull: ["$payload.betAmount", 0] },
        },
      },
      {
        $group: {
          _id: "$normalizedResult",
          count: { $sum: 1 },
          totalPayout: { $sum: "$payoutValue" },
          totalBet: { $sum: "$betValue" },
        },
      },
    ]),
    aggregatePlayerBreakdown(sessionMatch, { from, to }),
  ]);

  return {
    valid: true,
    filters: { gameCode, operatorId: operatorId ?? null, from: from ?? null, to: to ?? null },
    summary: summarizeResults(
      summaryRows.map((row) => ({
        result: row._id,
        count: row.count,
        totalPayout: row.totalPayout,
        totalBet: row.totalBet,
      }))
    ),
    byPlayer,
  };
}

async function listRoundResults({ sessionMatch, from, to, page, limit, result }) {
  const { page: pageNum, limit: limitNum, skip } = parsePagination(page, limit);
  const eventMatch = buildRoundEndedBaseMatch({ from, to });

  const pipeline = [
    { $match: eventMatch },
    ...roundEndedLookupStages(),
    { $match: sessionMatch },
    { $sort: { createdAt: -1 } },
  ];

  if (result) {
    pipeline.push({
      $addFields: {
        normalizedResult: {
          $let: {
            vars: {
              raw: {
                $toUpper: {
                  $ifNull: ["$payload.result", "$payload.outcome"],
                },
              },
            },
            in: {
              $switch: {
                branches: [
                  {
                    case: { $in: ["$$raw", ["WIN", "WON", "WINNER"]] },
                    then: "WIN",
                  },
                  {
                    case: { $in: ["$$raw", ["LOSS", "LOSE", "LOST", "LOSER"]] },
                    then: "LOSS",
                  },
                  {
                    case: { $in: ["$$raw", ["DRAW", "TIE"]] },
                    then: "DRAW",
                  },
                ],
                default: { $ifNull: ["$$raw", "UNKNOWN"] },
              },
            },
          },
        },
      },
    });
    pipeline.push({ $match: { normalizedResult: String(result).toUpperCase() } });
  }

  const countPipeline = [...pipeline, { $count: "total" }];
  pipeline.push({ $skip: skip }, { $limit: limitNum });

  const [rows, countRows] = await Promise.all([
    SessionEvent.aggregate(pipeline),
    SessionEvent.aggregate(countPipeline),
  ]);

  const total = countRows[0]?.total ?? 0;

  return {
    valid: true,
    events: rows.map(formatRoundResultRow),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function listEventsByOperator({
  operatorId,
  gameCode,
  from,
  to,
  page,
  limit,
  result,
}) {
  if (!operatorId) {
    return { valid: false, status: 400, message: "operatorId is required" };
  }

  const sessionMatch = buildSessionMatch({ operatorId, gameCode });
  const data = await listRoundResults({
    sessionMatch,
    from,
    to,
    page,
    limit,
    result,
  });

  return {
    ...data,
    filters: { operatorId, gameCode: gameCode ?? null, from: from ?? null, to: to ?? null, result: result ?? null },
  };
}

export async function listEventsByGame({
  gameCode,
  operatorId,
  from,
  to,
  page,
  limit,
  result,
}) {
  if (!gameCode) {
    return { valid: false, status: 400, message: "gameCode is required" };
  }

  const sessionMatch = buildSessionMatch({ operatorId, gameCode });
  const data = await listRoundResults({
    sessionMatch,
    from,
    to,
    page,
    limit,
    result,
  });

  return {
    ...data,
    filters: { gameCode, operatorId: operatorId ?? null, from: from ?? null, to: to ?? null, result: result ?? null },
  };
}
