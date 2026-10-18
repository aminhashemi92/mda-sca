require "rest-client"

module Lab
  module AdminPortal
    def self.ping(url)
      RestClient.get(url)
    end
  end
end
