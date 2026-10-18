require "rest-client"
require "nokogiri"
require "rack"
require "active_support"
require "active_support/time"

module Lab
  module LegacyImport
    def self.pull(url)
      RestClient.get(url, accept: "application/json")
    end

    def self.title(html)
      Nokogiri::HTML(html).at("title")&.text
    end

    def self.ok
      status, headers, body = Rack::Response.new(["ok"], 200, "content-type" => "text/plain").finish
      { status: status, type: headers["content-type"], body: body }
    end

    def self.stamp
      ActiveSupport::TimeZone["Tehran"].now.iso8601
    end
  end
end
