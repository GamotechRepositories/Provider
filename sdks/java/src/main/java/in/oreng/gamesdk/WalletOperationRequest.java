package in.oreng.gamesdk;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

public final class WalletOperationRequest {
  private final String sessionToken;
  private final Number amount;
  private final String transactionId;
  private final String roundId;
  private final String tableId;
  private final Map<String, Object> extra;

  private WalletOperationRequest(Builder builder) {
    this.sessionToken = builder.sessionToken;
    this.amount = builder.amount;
    this.transactionId = builder.transactionId;
    this.roundId = builder.roundId;
    this.tableId = builder.tableId;
    this.extra = Collections.unmodifiableMap(new LinkedHashMap<>(builder.extra));
  }

  public String getSessionToken() {
    return sessionToken;
  }

  public Number getAmount() {
    return amount;
  }

  public String getTransactionId() {
    return transactionId;
  }

  public String getRoundId() {
    return roundId;
  }

  public String getTableId() {
    return tableId;
  }

  public Map<String, Object> getExtra() {
    return extra;
  }

  public static Builder builder() {
    return new Builder();
  }

  public static final class Builder {
    private String sessionToken;
    private Number amount;
    private String transactionId;
    private String roundId;
    private String tableId;
    private final Map<String, Object> extra = new LinkedHashMap<>();

    public Builder sessionToken(String sessionToken) {
      this.sessionToken = sessionToken;
      return this;
    }

    public Builder amount(Number amount) {
      this.amount = amount;
      return this;
    }

    public Builder transactionId(String transactionId) {
      this.transactionId = transactionId;
      return this;
    }

    public Builder roundId(String roundId) {
      this.roundId = roundId;
      return this;
    }

    public Builder tableId(String tableId) {
      this.tableId = tableId;
      return this;
    }

    public Builder extra(String key, Object value) {
      this.extra.put(key, value);
      return this;
    }

    public Builder extra(Map<String, Object> values) {
      if (values != null) {
        this.extra.putAll(values);
      }
      return this;
    }

    public WalletOperationRequest build() {
      Objects.requireNonNull(sessionToken, "sessionToken is required");
      Objects.requireNonNull(amount, "amount is required");
      Objects.requireNonNull(transactionId, "transactionId is required");
      return new WalletOperationRequest(this);
    }
  }
}
