module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/static/css');
  // Copy the map dist files into the appropriate static directory
  eleventyConfig.addPassthroughCopy({ "../map/dist/*.css": "/static/css" });
  eleventyConfig.addPassthroughCopy({ "../map/dist/*.mjs*": "/static/js" });
  return {
    dir: {
      input: 'src',
      output: 'dist'
    },
  };
};
