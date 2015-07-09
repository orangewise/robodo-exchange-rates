var xml2js = Npm.require('xml2js');

Rates = {
  options: {

    // Name of collection to use
    collectionName: 'exchange_rates'

  },

  config: function (opts) {
    this.options = _.extend({}, this.options, opts);
  },

  settings: {
    url: 'http://www.ecb.int/stats/eurofxref/eurofxref-daily.xml',
    accuracy: 4
  },

  baseCurrency: 'EUR',

  conversionRate: function (from, to) {
    var self = this;
    var rate;

    try {

      if (from === to) {
        rate = 1;
      }
      else if (from === self.baseCurrency && from !== to) {
        rate = self._collection.findOne({currency: to}).rate;
      }
      else if (from !== self.baseCurrency && to === self.baseCurrency) {
        rate = self._collection.findOne({currency: from}).rate;
        rate = 1/rate;
      }
      else if (from !== self.baseCurrency && to !== self.baseCurrency) {
        var eurRate = self._collection.findOne({currency: to}).rate;
        rate = self._collection.findOne({currency: from}).rate;
        rate = 1/rate * eurRate;
      }

      return self.roundValues(rate, self.settings.accuracy);
    } catch (error) {
      console.log('catc',error);
      return undefined;
    }

  },

  convert: function(amount, from, to, callback) {
    var self = this;
    var exchangedValue = {};

    var exchangeRate = self.conversionRate(from, to);
    if (exchangeRate == undefined) {

      callback && callback('Exchange rate not found in collection...');

    } else {

      var exchangedAmount = self.roundValues(amount * exchangeRate, self.settings.accuracy);
      exchangedValue.amount = amount;
      exchangedValue.from = from;
      exchangedValue.to = to;
      exchangedValue.rate = exchangeRate;
      exchangedValue.exchangedAmount = exchangedAmount;

      callback && callback(null, exchangedValue);
    }

  },


  roundValues: function (value, places) {
    var multiplier = Math.pow(10, places);
    return (Math.round(value * multiplier) / multiplier);
  },

  removeNamespaces: function (xml) {
    var fixedXML = xml.replace(/(<\/?)(\w+:)/g,'$1');
    return (fixedXML.replace(/xmlns(:\w+)?="[^"]*"/g,'')).trim();
  },

  parseXML: function(xml, callback) {
    var self = this;
    var cleanXML = self.removeNamespaces(xml);
    var parser = new xml2js.Parser();

    parser.parseString(cleanXML, function(error, result){
      var currencies = result.Envelope.Cube[0].Cube[0].Cube;
      self.upsertCurrencies(currencies);
      callback && callback();
    });

  },

  upsertCurrencies: function(currencies) {
    var self = this;
    _.each(currencies, function (item) {
       var currency = eval('item.$').currency;
       var rate = Number(eval('item.$').rate);
       self._collection.update(
          {currency: currency},
          {currency: currency, rate: rate}, 
          {upsert: true}
       );
    });
    self._collection.update(
      {currency: self.baseCurrency},
      {currency: self.baseCurrency, rate: 1}, 
      {upsert: true}
    );
  }
};

Meteor.startup( function () {
  var options = Rates.options;

  // Collection holding ECB rates.
  Rates._collection = new Mongo.Collection(options.collectionName);
  Rates._collection._ensureIndex({currency: 1}, {unique: true});

});


Rates.refreshRates =  function () {
  var self = this;
  HTTP.get(self.settings.url, function(error, response) {

    if (!error && response.statusCode == 200) {
      self.parseXML(response.content, function () {
        console.log('Rates refreshed');
      });
    } else {
      console.log('Error when calling', self.settings.url, error);
    }

  });


};

