# robodo:exchange-rates

A simple package fetching ECB exchange rates and storing them in a collection.

Based on https://www.npmjs.com/package/ecb-exchange-rates

## Installation

``` sh
$ meteor add robodo:exchange-rates
```


### Basics

Fill/refresh your collection:

``` js
Rates.refreshRates() 
```

After that you can use: 

``` js
Rates.convert(10, 'EUR', 'USD', function (error, result) {
  if (error) console.log(error);
  console.log(result);
});
```




### Usage

robodo:exchange-rates uses a collection called `exchange_rates` for storing the ECB rates. The name of this collection can be configured. See below...


### Configuration

You can configure Rates with the `config` method. Defaults are:

``` js
Rates.config({

  // Name of collection used for storing the rates.
  collectionName: 'exchange_rates',
  // Try to refresh rates while querying rates.
  autoRefresh: true,
  // Refresh interval in hours.
  refreshInterval: 4

});
```


# Supported Currencies

 * AUD - Australian Dollar
 * BGN - Bulgarian Lev
 * BRL - Brazilian Real
 * CAD - Canadian Dollar
 * CHF - Swiss Franc
 * CNY - Chinese Yuan
 * CZK - Czech Koruna
 * DKK - Danish Krone
 * EUR - Euro
 * GBP - British Pound
 * HKD - Hong Kong Dollar
 * HRK - Croatian Kuna
 * HUF - Hungarian Forint
 * IDR - Indonesian Rupiah
 * ILS - Israeli New Shekel
 * INR - Indian Rupee
 * JPY - Japanese Yen
 * KRW - South Korean Won
 * LTL - Lithuanian Litas
 * LVL - Latvian Lats
 * MXN - Mexian Peso
 * MYR - Malaysian Ringgit
 * NOK - Norwegian Krone
 * NZD - New Zealand Dollar
 * PHP - Phillippine Peso
 * PLN - Polish Zloty
 * RON - Romanian New Leu
 * RUB - Russian Rouble
 * SEK - Swedish Krona
 * SGD - Singapore Dollar
 * THB - Thai Baht
 * TRY - Turkish Lira
 * USD - US Dollar
 * ZAR - South African Rand

## License

MIT.