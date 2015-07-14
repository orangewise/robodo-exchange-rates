
if (Meteor.isClient) {


  Template.hello.helpers({


  });

  Template.hello.events({
    'click #refresh': function () {
      Meteor.call('refreshRates');
    },
    'click #test': function () {
      Meteor.call('test');
    }
  });
}

if (Meteor.isServer) {

  Rates.config({
    // Name of collection used for storing the rates.
    collectionName: 'rates',
    //
    autoRefresh: false
  });

  Meteor.methods({
    refreshRates: function () {
      Rates.refreshRates();
    },


    test: function () {
      Rates.convert(10, 'EUR', 'USD', function (error, result) {
        if (error) {
          console.log('error',error);
        } else {
          console.log(result);
        }
      });

      Rates.convert(10, 'EUR', 'EUR', function (error, result) {
        if (error) {
          console.log('error',error);
        } else {
          console.log(result);
        }
      });

      Rates.convert(10, 'USD', 'USD', function (error, result) {
        if (error) {
          console.log('error',error);
        } else {
          console.log(result);
        }
      });

      Rates.convert(10, 'USD', 'EUR', function (error, result) {
        if (error) {
          console.log('error',error);
        } else {
          console.log(result);
        }
      });

      Rates.convert(10, 'USD', 'SEK', function (error, result) {
        if (error) {
          console.log('error',error);
        } else {
          console.log(result);
        }
      });

      Rates.convert(10, 'NOK', 'SEK', function (error, result) {
        if (error) {
          console.log('error',error);
        } else {
          console.log(result);
        }
      });

    }

  });

}
