const i18n = require('eleventy-plugin-i18n');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/static/css');
  eleventyConfig.addPassthroughCopy('src/static/img');
  eleventyConfig.addPassthroughCopy('src/static/fonts');
  eleventyConfig.addPassthroughCopy('src/static/data');
  eleventyConfig.addPassthroughCopy({ "../map/dist/*.css": "/static/css" });
  eleventyConfig.addPassthroughCopy({ "../map/dist/*.mjs*": "/static/js" });

  eleventyConfig.addPlugin(i18n, {
    translations: {
      "Paths to Wellbeing": {
        'en': 'Paths to Wellbeing',
        'cy': 'Llywbrau i Lesiant'
      },
      "Home": {
        'en': 'Home',
        'cy': 'Hafan'
      },
      "About": {
        'en': 'About',
        'cy': 'Ynghylch'
      },
      "Map": {
        'en': 'Map',
        'cy': 'Map'
      },
      "Visit Facebook": {
        'en': 'Visit our Facebook page (opens a new browser tab)',
        'cy': 'Visit our Facebook page (opens a new browser tab)'
      },
      "Visit Twitter": {
        'en': 'Visit our Twitter page (opens a new browser tab)',
        'cy': 'Visit our Twitter page (opens a new browser tab)'
      },
      "Visit Instagram": {
        'en': 'Visit our Instagram page (opens a new browser tab)',
        'cy': 'Visit our Instagram page (opens a new browser tab)'
      }
    },
    fallbackLocales: {
      '*': 'en'
    }
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
