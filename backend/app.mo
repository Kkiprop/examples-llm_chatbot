import LLM "mo:llm";
import Http "mo:http";
import Debug "mo:debug";

persistent actor {

  // Fetch market data from CoinGecko API
  public func getMarketData(coin: Text) : async Text {
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=" # coin # "&vs_currencies=usd";
    
    let request = {
      url = url;
      method = #get;
      headers = [];
      body = null;
    };

    let response = await Http.fetch(request);

    switch (response.status) {
      case (#ok) {
        let bodyText = switch(response.body) {
          case (?text) { text };
          case _ { "Error: No data received." };
        };
        return bodyText;
      };
      case _ { return "Error: Failed to fetch market data." };
    };
  };

  // Process user prompt and give insights
  public func prompt(prompt : Text) : async Text {
    let insight = "Analyzing market trends...";  // Default response

    if (prompt # "bitcoin" or prompt # "BTC") {
      let btcData = await getMarketData("bitcoin");
      insight := "Current BTC price: " # btcData # ". Consider buying if it's below $40k and selling above $60k.";
    };

    let fullPrompt = prompt # " " # insight;
    await LLM.prompt(#Llama3_1_8B, fullPrompt);
  };

  // Handle chat interactions
  public func chat(messages : [LLM.ChatMessage]) : async Text {
    await LLM.chat(#Llama3_1_8B, messages);
  };
};
