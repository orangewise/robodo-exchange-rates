var xml2js = Npm.require('xml2js');

Rates = {

  options: {

    // Name of collection to use.
    collectionName: 'exchange_rates',

    // Kick of refresh while querying rates collection.
    autoRefresh: true,
    
    // Refresh interval in hours.
    refreshInterval: 4

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

  conversionRate: function (from, to, callback) {
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
      
      if (self.options.autoRefresh && 
          doc &&
          self.hoursBetween(doc.updated, new Date()) >= self.options.refreshInterval) 
      {
        console.log('+++++++++++++refresh');
        self.refreshRates();
      }
      callback && callback(null, self.roundValues(rate, self.settings.accuracy));

    } catch (error) {
      console.log('conversionRate error', error);
      if (self.options.autoRefresh) {
        console.log('call refresh');

        self.refreshRates(function (error) {
          if (error) {
            callback && callback(error);

          } else {
            // Try to find rate once more.
            self.conversionRate(from, to, function (error, result) {
              if (error) {
                callback && callback(error);                 
              } else {
                callback && callback(null, result);
              }
            });
          }
        });

      } else {
        callback && callback(error);        
      } 
    }

  },


  convert: function(amount, from, to, callback) {
    var self = this;
    var exchangedValue = {};

    self.conversionRate(from, to, function (error, result) {
      if (error) {
        callback && callback('Exchange rate not found in collection...' + error);
      } else {
        var exchangeRate = result;
        var exchangedAmount = self.roundValues(amount * exchangeRate, self.settings.accuracy);
        exchangedValue.from = from;
        exchangedValue.to = to;
        exchangedValue.rate = exchangeRate;
        exchangedValue.amount = amount;
        exchangedValue.exchangedAmount = exchangedAmount;
        callback && callback(null, exchangedValue);        
      }
    });
  },


  hoursBetween: function (date1, date2) {
    var ms = date2 - date1;
    var hours = ms * (1/3600000);
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
       var currency = item.$.currency;
       var rate = Number(item.$.rate);
       self._collection.update(
          {currency: currency},
          {currency: currency, rate: rate, updated: updated, lastModified: lastModifiedDate}, 
          {upsert: true}
       );
    });
  },


  refreshRates: function (callback) {
    var self = this;
    if (!self.refreshing) {
      self.refreshing = true;

      HTTP.get(self.settings.url, function(error, response) {
        if (!error && response.statusCode == 200) {
          self.parseXML(response, function () {
            self.refreshing = false;
            var r = 'Rates have been refreshed.';
            console.log(r);
            callback && callback(null, r);
          });
        } else {
          var e = 'Error when calling ' + self.settings.url + ' error ' + error;
          console.log(e);
          callback && callback(e);
        }
      });    

    } else {
      console.log('Rates are currently being refreshed...');
    }
  }

};


Meteor.startup( function () {
  var options = Rates.options;

  // Collection holding ECB rates.
  Rates._collection = new Mongo.Collection(options.collectionName);
  Rates._collection._ensureIndex({currency: 1}, {unique: true});
});



