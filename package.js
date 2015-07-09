Package.describe({
  name: 'robodo:exchange-rates',
  summary: 'A simple package fetching ECB exchange rates and storing them in a collection.',
  version: '0.0.1',
  git: 'https://github.com/orangewise/robodo-exchange-rates.git'
});

Npm.depends({'xml2js': '0.4.4'});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.use(['underscore', 'mongo', 'http'], 'server');
  api.addFiles('rates.js','server');
  api.export(['Rates'],'server');
});

