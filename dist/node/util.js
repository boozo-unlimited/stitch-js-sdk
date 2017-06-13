'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Utility function for displaying deprecation notices
 *
 * @param {Function} fn the function to deprecate
 * @param {String} msg the message to display to the user regarding deprecation
 */
function deprecate(fn, msg) {
  var alreadyWarned = false;
  function deprecated() {
    if (!alreadyWarned) {
      alreadyWarned = true;
      console.warn('DeprecationWarning: ' + msg);
    }

    return fn.apply(this, arguments);
  }

  deprecated.__proto__ = fn; // eslint-disable-line
  if (fn.prototype) {
    deprecated.prototype = fn.prototype;
  }

  return deprecated;
}

/**
 * Utility method for converting the rest response from services
 * into composable `thenables`. This allows us to use the same
 * API for calling helper methods (single-stage pipelines) and
 * pipeline building.
 *
 * @param {Object} service the service to execute the stages on
 * @param {Array} stages the pipeline stages to execute
 * @param {Function} [finalizer] optional function to call on the result of the response
 */
function serviceResponse(service, stages, finalizer) {
  if (service && !service.client) {
    throw new Error('Service has no client');
  }

  if (finalizer && typeof finalizer !== 'function') {
    throw new Error('Service response finalizer must be a function');
  }

  if (service.hasOwnProperty('__let__')) {
    if (Array.isArray(stages)) {
      // what do we do here?
    } else {
      stages.let = service.__let__;
    }
  }

  var client = service.client;
  Object.defineProperties(stages, {
    then: {
      enumerable: false, writable: false, configurable: false,
      value: function value(resolve, reject) {
        var result = client.executePipeline(Array.isArray(stages) ? stages : [stages]);
        return !!finalizer ? result.then(finalizer).then(resolve, reject) : result.then(resolve, reject);
      }
    },
    catch: {
      enumerable: false, writable: false, configurable: false,
      value: function value(rejected) {
        var result = client.executePipeline(Array.isArray(stages) ? stages : [stages]);
        return !!finalizer ? result.then(finalizer).catch(rejected) : result.catch(rejected);
      }
    },
    post: {
      enumerable: false, writable: true, configurable: true,
      value: function value(options) {
        if (Array.isArray(stages)) {
          // what do we do here?
        } else {
          stages.post = options;
        }

        return stages;
      }
    }
  });

  return stages;
}

/**
 * Mixin that allows a definition of an optional `let` stage for
 * services is mixes in with.
 *
 * @param {*} Type the service to mixin
 */
function letMixin(Type) {
  Type.prototype.let = function (options) {
    Object.defineProperty(this, '__let__', {
      enumerable: false, configurable: false, writable: false, value: options
    });

    return this;
  };

  return Type;
}

exports.deprecate = deprecate;
exports.serviceResponse = serviceResponse;
exports.letMixin = letMixin;