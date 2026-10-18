package ir.lab.northwind.legacy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thoughtworks.xstream.XStream;
import java.util.Collections;
import java.util.Map;
import org.apache.commons.collections.ListUtils;
import org.apache.commons.text.StringEscapeUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.core.LoggerContext;
import org.yaml.snakeyaml.Yaml;

public class OrderBridge {
    private static final Logger LOG = LogManager.getLogger(OrderBridge.class);
    private static final String LOCAL_CONFIG = "currency: IRR\nchannel: pos\n";
    private static final String LOCAL_XML = "<string>ok</string>";

    public String describe(String orderId) {
        String escaped = StringEscapeUtils.escapeHtml4(orderId);
        LoggerContext.getContext(false);
        LOG.info("processed order {}", escaped);
        return escaped;
    }

    public Map<String, Object> readLocalConfig() {
        Object loaded = new Yaml().load(LOCAL_CONFIG);
        if (loaded instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> values = (Map<String, Object>) loaded;
            return values;
        }
        return Collections.emptyMap();
    }

    public int lineCount(java.util.List<String> left, java.util.List<String> right) {
        return ListUtils.union(left, right).size();
    }

    public String toJson(Map<String, Object> order) throws Exception {
        return new ObjectMapper().writeValueAsString(order);
    }

    public String roundTripXml() {
        XStream xstream = new XStream();
        Object value = xstream.fromXML(LOCAL_XML);
        return xstream.toXML(value);
    }
}
