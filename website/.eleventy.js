const i18n = require('eleventy-plugin-i18n');
const { transform, isObject, isUndefined } = require('lodash');

const translations = require('./src/_data/translations.json');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/static/css');
  eleventyConfig.addPassthroughCopy('src/static/img');
  eleventyConfig.addPassthroughCopy('src/static/fonts');
  eleventyConfig.addPassthroughCopy('src/static/data');
  eleventyConfig.addPassthroughCopy({ "../map/dist/*.css": "/static/css" });
  eleventyConfig.addPassthroughCopy({ "../map/dist/*.mjs*": "/static/js" });

  eleventyConfig.addPlugin(i18n, {
    translations,
    fallbackLocales: {
      '*': 'en'
    }
  });

  eleventyConfig.addFilter('json', JSON.stringify);

  eleventyConfig.addFilter('dropOtherLocales', function (translations, locale) {
    return delPropDeep(translations, getAlternativeLanguage(locale));
  });

  eleventyConfig.addFilter("getCurrentLanguage", function(url) {
    return getCurrentLanguage(url);
  });

  eleventyConfig.addFilter("getAlternativeLanguage", function(url) {
    let lang = getCurrentLanguage(url);
    return getAlternativeLanguage(lang);
  });

  eleventyConfig.addFilter("getAlternativeLanguageUrl", function(url) {
    let currentLanguage = getCurrentLanguage(url);
    let alternativeLanguage = getAlternativeLanguage(currentLanguage);
    let altUrl = url.replace(new RegExp('/' + currentLanguage + '/'), '/' + alternativeLanguage + '/');
    return altUrl;
  });

  return {
    dir: {
      input: 'src',
      output: 'dist'
    },
    markdownTemplateEngine: "njk",
  };
};

// Helper functions
/**
 * Get the current language
 */
function getCurrentLanguage(url) {
  return url.split('/')[1];
}

/**
 * Get the alternative language
 */
function getAlternativeLanguage(currentLanguage) {
  let alternativeLanguage = (currentLanguage == 'en') ? 'cy' : 'en';
  return alternativeLanguage;
}

/**
 * Deep clone `obj` omitting all properties with the specified `key`
 * @param {Object} Object to deep clone
 * @param {string} key Name of key to skip when cloning
 * @returns {Object}
 */
function delPropDeep(obj, key) {
  return transform(obj, (r, v, k) => {
    if (k === key) return;
    r[k] = isObject(v) ? delPropDeep(v, key) : v;
  });
}
