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

  refreshing: false,

  conversionRate: function (from, to) {
    var self = this;
    var doc, rate;

    try {

      if (from === to) {
        rate = 1;
      }
      else if (from === self.baseCurrency && from !== to) {
        doc = self._collection.findOne({currency: to});
        rate = doc.rate;
      }
      else if (from !== self.baseCurrency && to === self.baseCurrency) {
        doc = self._collection.findOne({currency: from});
        rate = doc.rate;
        rate = 1/rate;
      }
      else if (from !== self.baseCurrency && to !== self.baseCurrency) {
        var eurRate = self._collection.findOne({currency: to}).rate;
        doc = self._collection.findOne({currency: from});
        rate = doc.rate;
        rate = 1/rate * eurRate;
      }
      
      if (doc && self.hoursBetween(doc.updated, new Date()) >= 0) {
        console.log('+++++++++++++refresh');
        self.refreshRates();
      }
      return self.roundValues(rate, self.settings.accuracy);
    } catch (error) {
      console.log('catc',error);
      self.refreshRates();
      return undefined;
    }

  },

  convert: function(amount, from, to, callback) {
    var self = this;
    var exchangedValue = {};

    var exchangeRate = self.conversionRate(from, to);
    if (exchangeRate === undefined) {

      callback && callback('Exchange rate not found in collection...');

    } else {

      var exchangedAmount = self.roundValues(amount * exchangeRate, self.settings.accuracy);
      exchangedValue.from = from;
      exchangedValue.to = to;
      exchangedValue.rate = exchangeRate;
      exchangedValue.amount = amount;
      exchangedValue.exchangedAmount = exchangedAmount;

      callback && callback(null, exchangedValue);
    }

  },

  hoursBetween: function (date1, date2) {
    var ms = date2 - date1;
    var hours = ms * (1/3600000);
    console.log('ms', ms, 'hours', hours);
    return hours;
  },

  roundValues: function (value, places) {
    var multiplier = Math.pow(10, places);
    return (Math.round(value * multiplier) / multiplier);
  },

  removeNamespaces: function (xml) {
    var fixedXML = xml.replace(/(<\/?)(\w+:)/g,'$1');
    return (fixedXML.replace(/xmlns(:\w+)?="[^"]*"/g,'')).trim();
  },

  parseXML: function(doc, callback) {
    var self = this;
    var lastModified = Date.parse(doc.headers['last-modified']);
    var cleanXML = self.removeNamespaces(doc.content);
    var parser = new xml2js.Parser();

    parser.parseString(cleanXML, function(error, result){
      var currencies = result.Envelope.Cube[0].Cube[0].Cube;
      self.upsertCurrencies(currencies, lastModified);
      callback && callback();
    });

  },

  upsertCurrencies: function (currencies, lastModified) {
    var self = this;
    // Use last-modified header for updated date.
    var updated = new Date();
    var lastModifiedDate = new Date();
    lastModifiedDate.setTime(lastModified);     
    _.each(currencies, function (item) {
       var currency = eval('item.$').currency;
       var rate = Number(eval('item.$').rate);
       self._collection.update(
          {currency: currency},
          {currency: currency, rate: rate, updated: updated, lastModified: lastModifiedDate}, 
          {upsert: true}
       );
    });
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
  if (!this.refreshing) {
    self.refreshing = true;

    HTTP.get(self.settings.url, function(error, response) {
      if (!error && response.statusCode == 200) {
        self.parseXML(response, function () {
          self.refreshing = false;
          console.log('Rates refreshed');
        });
      } else {
        console.log('Error when calling', self.settings.url, error);
      }
    });    

  } else {
    console.log('Rates are currently being refreshed...');
  }
};

