package in.oreng.gamesdk;

public class ProviderSDKException extends RuntimeException {
  private final Integer status;
  private final Object data;

  public ProviderSDKException(String message) {
    this(message, null, null);
  }

  public ProviderSDKException(String message, Integer status, Object data) {
    super(message);
    this.status = status;
    this.data = data;
  }

  public Integer getStatus() {
    return status;
  }

  public Object getData() {
    return data;
  }
}
