package in.oreng.gamesdk;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

public class ProviderGameServerSDK {
  private static final String DEFAULT_API_BASE = "https://api.dpbossking.com/api/v1";
  private static final Gson GSON = new Gson();

  private final String apiBase;
  private final String gameServerKey;
  private final HttpClient httpClient;

  public ProviderGameServerSDK(String apiBaseUrl, String gameServerKey) {
    this(apiBaseUrl, gameServerKey, HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build());
  }

  public ProviderGameServerSDK(String apiBaseUrl, String gameServerKey, HttpClient httpClient) {
    String resolvedBase = apiBaseUrl == null || apiBaseUrl.isBlank()
        ? DEFAULT_API_BASE
        : apiBaseUrl;
    this.apiBase = resolvedBase.replaceAll("/+$", "");

    String resolvedKey = gameServerKey;
    if (resolvedKey == null || resolvedKey.isBlank()) {
      resolvedKey = System.getenv("GAME_SERVER_API_KEY");
    }
    if (resolvedKey == null || resolvedKey.isBlank()) {
      throw new ProviderSDKException(
          "gameServerKey is required — set GAME_SERVER_API_KEY on your game server"
      );
    }

    this.gameServerKey = resolvedKey;
    this.httpClient = httpClient;
  }

  public JsonObject getBalance(String sessionToken) {
    requireNonBlank(sessionToken, "sessionToken");
    return walletCall("balance", Map.of("sessionToken", sessionToken));
  }

  public JsonObject getPlayerProfile(String sessionToken) {
    requireNonBlank(sessionToken, "sessionToken");
    return walletCall("player-profile", Map.of("sessionToken", sessionToken));
  }

  public JsonObject debit(WalletOperationRequest request) {
    return walletCall("debit", toBody(request));
  }

  public JsonObject credit(WalletOperationRequest request) {
    return walletCall("credit", toBody(request));
  }

  private JsonObject walletCall(String operation, Map<String, Object> body) {
    JsonObject response = request("/adapters/" + operation, body);
    JsonElement data = response.get("data");

    if (data == null || data.isJsonNull()) {
      return new JsonObject();
    }

    if (data.isJsonObject()) {
      return data.getAsJsonObject();
    }

    JsonObject wrapped = new JsonObject();
    wrapped.add("value", data);
    return wrapped;
  }

  private Map<String, Object> toBody(WalletOperationRequest request) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("sessionToken", request.getSessionToken());
    body.put("amount", request.getAmount());
    body.put("transactionId", request.getTransactionId());

    if (request.getRoundId() != null && !request.getRoundId().isBlank()) {
      body.put("roundId", request.getRoundId());
    }
    if (request.getTableId() != null && !request.getTableId().isBlank()) {
      body.put("tableId", request.getTableId());
    }

    body.putAll(request.getExtra());
    return body;
  }

  private JsonObject request(String path, Map<String, Object> body) {
    String normalizedPath = path.startsWith("/") ? path : "/" + path;
    String url = apiBase + normalizedPath;
    String sessionToken = body.get("sessionToken") == null
        ? null
        : String.valueOf(body.get("sessionToken"));

    HttpRequest.Builder builder = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .timeout(Duration.ofSeconds(30))
        .header("Content-Type", "application/json")
        .header("X-Game-Server-Key", gameServerKey);

    if (sessionToken != null && !sessionToken.isBlank()) {
      builder.header("Authorization", "Bearer " + sessionToken);
    }

    HttpRequest request = builder
        .POST(HttpRequest.BodyPublishers.ofString(GSON.toJson(body)))
        .build();

    HttpResponse<String> response;
    try {
      response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    } catch (IOException | InterruptedException error) {
      if (error instanceof InterruptedException) {
        Thread.currentThread().interrupt();
      }
      throw new ProviderSDKException("Network error — unable to reach Provider API");
    }

    JsonObject parsed;
    try {
      parsed = JsonParser.parseString(response.body()).getAsJsonObject();
    } catch (RuntimeException error) {
      throw new ProviderSDKException(
          "Invalid JSON response from Provider API",
          response.statusCode(),
          response.body()
      );
    }

    boolean success = !parsed.has("success") || parsed.get("success").getAsBoolean();
    if (response.statusCode() >= 400 || !success) {
      String message = parsed.has("message")
          ? parsed.get("message").getAsString()
          : "Provider API request failed";
      throw new ProviderSDKException(message, response.statusCode(), parsed);
    }

    return parsed;
  }

  private static void requireNonBlank(String value, String fieldName) {
    if (value == null || value.isBlank()) {
      throw new ProviderSDKException(fieldName + " is required");
    }
  }
}
