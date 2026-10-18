package ir.lab.northwind.web;

import ir.lab.northwind.legacy.OrderBridge;
import ir.lab.northwind.net.Http2Edge;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class OrderController {
    private final OrderBridge bridge = new OrderBridge();
    private final Http2Edge edge = new Http2Edge();
    private final DefaultListableBeanFactory beans = new DefaultListableBeanFactory();

    @GetMapping("/orders/sample")
    @ResponseBody
    public Map<String, Object> sample() throws Exception {
        Map<String, Object> body = new LinkedHashMap<String, Object>();
        body.put("id", bridge.describe("1001"));
        body.put("config", bridge.readLocalConfig());
        body.put("lines", bridge.lineCount(Arrays.asList("a"), Arrays.asList("b")));
        body.put("json", bridge.toJson(body));
        body.put("xml", bridge.roundTripXml());
        body.put("streams", edge.openStreams());
        body.put("beans", beans.getBeanDefinitionCount());
        return body;
    }
}
