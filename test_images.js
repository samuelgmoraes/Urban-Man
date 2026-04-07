const https = require('https');
const urls = [
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5',
  'https://images.unsplash.com/photo-1591195853828-11db59a44f6b',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d',
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a',
  'https://images.unsplash.com/photo-1520975954732-57dd22299614',
  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80',
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a',
  'https://images.unsplash.com/photo-1517424683050-61a7a0b3e648',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246',
  'https://images.unsplash.com/photo-1524805444758-089113d48a6d'
];

urls.forEach(url => {
  https.get(url, res => {
    console.log(url + ' -> ' + res.statusCode);
  });
});
