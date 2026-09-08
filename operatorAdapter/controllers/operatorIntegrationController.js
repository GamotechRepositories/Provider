import {
  listIntegrations,
  getIntegrationByOperatorId,
  createIntegration,
  updateIntegration,
  updateIntegrationStatus,
  deleteIntegration,
} from "../services/operatorIntegrationService.js";

export async function listIntegrationsHandler(req, res) {
  try {
    const { status, environment } = req.query;
    const integrations = await listIntegrations({ status, environment });

    return res.status(200).json({
      success: true,
      count: integrations.length,
      integrations,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to list integrations",
    });
  }
}

export async function getIntegrationHandler(req, res) {
  const { operatorId } = req.params;

  try {
    const integration = await getIntegrationByOperatorId(operatorId);

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "Integration not found",
      });
    }

    return res.status(200).json({
      success: true,
      integration,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch integration",
    });
  }
}

export async function createIntegrationHandler(req, res) {
  try {
    const result = await createIntegration(req.body);

    if (!result.valid) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Integration created",
      integration: result.integration,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to create integration",
    });
  }
}

export async function updateIntegrationHandler(req, res) {
  const { operatorId } = req.params;

  try {
    const result = await updateIntegration(operatorId, req.body);

    if (!result.valid) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Integration updated",
      integration: result.integration,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update integration",
    });
  }
}

export async function updateIntegrationStatusHandler(req, res) {
  const { operatorId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "status is required",
    });
  }

  try {
    const result = await updateIntegrationStatus(operatorId, status);

    if (!result.valid) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Integration status updated",
      integration: result.integration,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update integration status",
    });
  }
}

export async function deleteIntegrationHandler(req, res) {
  const { operatorId } = req.params;

  try {
    const result = await deleteIntegration(operatorId);

    if (!result.valid) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Integration deleted",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to delete integration",
    });
  }
}
