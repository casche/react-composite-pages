var webpackConfig = require('../../webpackConfig');

module.exports = webpackConfig({
    entry: './client',
    path: '../../../lib/pages',
    publicPath: '/nui/client/pages'
});
