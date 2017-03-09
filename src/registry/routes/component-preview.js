'use strict';

var _ = require('underscore');

var urlBuilder = require('../domain/url-builder');
var getComponentFallback = require('./helpers/get-component-fallback');

function componentPreview(err, req, res, component) {
    if(err) {
        res.errorDetails = err.localError;
        res.errorCode = 'NOT_FOUND';
        return res.status(404).json(err);
    }

    var isHtmlRequest = !!req.headers.accept && req.headers.accept.indexOf('text/html') >= 0;

    if(isHtmlRequest && !!res.conf.discovery){

        return res.render('component-preview', {
            component: component,
            dependencies: _.keys(component.dependencies),
            href: res.conf.baseUrl,
            qs: urlBuilder.queryString(req.query)
        });

    } else {
        res.status(200).json(_.extend(component, {
            requestVersion: req.params.componentVersion || ''
        }));
    }
}

module.exports = function(conf, repository){
  return function(req, res){
    
    repository.getComponent(req.params.componentName, req.params.componentVersion, function(localRegistryError, localComponent){

      if(localRegistryError && conf.fallbackRegistryUrl) {
        return getComponentFallback.getComponentPreview(conf, req, res, localRegistryError, function(error, component){
            componentPreview(error, req, res, component);
        });
      }

      componentPreview(localRegistryError, req, res, localComponent);

    });
  };
};