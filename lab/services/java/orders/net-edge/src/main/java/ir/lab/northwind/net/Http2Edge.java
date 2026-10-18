package ir.lab.northwind.net;

import io.netty.handler.codec.http2.DefaultHttp2Connection;
import io.netty.handler.codec.http2.Http2Connection;

public class Http2Edge {
    public int openStreams() {
        Http2Connection connection = new DefaultHttp2Connection(true);
        return connection.numActiveStreams();
    }
}
