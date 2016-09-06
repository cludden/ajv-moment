'use strict';

import moment from 'moment';

const momentFns = Object.keys(moment.fn);

/**
 * Configure the plugin by attaching moment to the ajv instance and defining the
 * 'moment' custom keyword
 * @param  {Object} options - plugin options
 * @return {Object} keywordSettings
 */
function plugin(options) {
    if (!options || typeof options !== 'object') {
        throw new Error('AjvMoment#plugin requires options');
    }
    if (!options.ajv) {
        throw new Error(`AjvMoment#plugin options requries an 'ajv' attribute (ajv instance)`);
    }
    if (!options.moment) {
        throw new Error(`AjvMoment#plugin options requries a 'moment' attribute (moment.js)`);
    }
    const { ajv, moment } = options;
    ajv.moment = moment;
    const keywordSettings = {
        type: 'string',
        statements: true,
        errors: true,
        inline
    };
    if (ajv) {
        ajv.addKeyword('moment', keywordSettings);
    }
    return keywordSettings;
}


/**
 * Determine whether or not val is an array
 * @param  {*} val
 * @return {Boolean}
 */
function isArray(val) {
    return Object.prototype.toString.call(val) === '[object Array]';
}


/**
 * Ajv inline method
 * @param  {Object} it
 * @param  {String} keyword
 * @param  {*} schema
 * @return {String}
 */
function inline(it, keyword, schema) {
    const data = 'data' + (it.dataLevel || '');
    const valid = 'valid' + it.level;
    const err = 'ajvmErrMsg' + it.level;
    const schemaOptions = typeof schema === 'object' ? schema : {};
    let formats = schemaOptions.format || [];
    let validations = schemaOptions.validate || [];

    if (!isArray(validations)) {
        validations = [validations];
    }

    const _validations = validations.map(function(validation) {
        const _validation = {
            test: validation.test,
            value: validation.value
        };
        if (!_validation.test || momentFns.indexOf(_validation.test) === -1) {
            throw new Error('Invalid validation: "test" is required and must be a valid moment function');
        }
        if (!_validation.value) {
            throw new Error('Invalid validation: "value" is required');
        }
        if (!isArray(_validation.value)) {
            _validation.value = [_validation.value];
        }
        _validation.value = _validation.value.map(function(val) {
            const _val = { now: val.now, $data: val.$data, manipulate: val.manipulate };
            if (_val.now !== true && typeof _val.$data !== 'string') {
                _val.now === true;
            } else {
                _val.value = it.util.getData(_val.$data, it.dataLevel, it.dataPathArr);
            }
            if (!isArray(_val.manipulate)) {
                _val.manipulate = [];
            }
            _val.manipulate = _val.manipulate.map(function(manipulation) {
                const manipulationMethod = Object.keys(manipulation)[0];
                if (momentFns.indexOf(manipulationMethod) === -1) {
                    throw new Error(`Invalid validation value: unsupported manipulation method specified: ${manipulationMethod}`);
                }
                return {
                    method: manipulationMethod,
                    args: isArray(manipulation[manipulationMethod]) ? manipulation[manipulationMethod] : [manipulation[manipulationMethod]]
                };
            });
            return _val;
        });
        return _validation;
    });

    let templ = `
            var moment = self.moment;
            ${valid} = true;
            var ${err} = {
                keyword: "${keyword}",
                dataPath: "${it.dataPathArr[it.dataLevel] || ''}",
                schemaPath: "${it.schemaPath}",
                data: ${data}
            };

            var ajvmFormats${it.level} = ${formats && formats.length ? JSON.stringify(formats) : '[moment.ISO_8601]'};
            var ajvmStrict${it.level} = ${formats && formats.length ? true : false };
            var d = moment(${data}, ajvmFormats${it.level}, ajvmStrict${it.level});
            if (!d.isValid()) {
                ${err}.message = 'should be a valid date${formats && formats.length ? ' with format ' + JSON.stringify(formats) : ''}';
                ${valid} = false;
            }
        `;

    if (_validations.length) {
        _validations.forEach(function(validation, i) {
            const testResult = 'ajvmTestResult_' + it.level + '_' + i;
            let testVals = '[';
            templ += `
                    if (${valid} === true) {
                `;
            validation.value.forEach(function(val, ii) {
                const testVal = 'ajvmTestVal_' + it.level + '_' + i + '_' + ii;
                testVals += testVal + ',';
                if (val.now === true) {
                    templ += `
                            var ${testVal} = moment();
                        `;
                } else {
                    templ += `
                            var ${testVal} = moment(${val.value}, ${val.format ? JSON.stringify(val.format) : '[moment.ISO_8601]'});
                        `;
                }
                val.manipulate.forEach(function(manipulation) {
                    templ += `
                            ${testVal}.${manipulation.method}.apply(${testVal}, ${JSON.stringify(manipulation.args)});
                        `;
                });
            });
            testVals = testVals.slice(0, testVals.length - 1) + ']';
            templ += `
                        var ${testResult} = d.${validation.test}.apply(d, ${testVals});
                        if (!${testResult}) {
                            ${err}.message = '"${validation.test}" validation failed for value(s): ';
                            ${testVals}.forEach(function(c) {
                                ${err}.message += c.toISOString() + ', ';
                            });
                            ${err}.message = ${err}.message.slice(0, -2);
                            ${valid} = false;
                        }
                    }
                `;
        });

    }

    templ += `
            if (!${valid}) {
                errors++;
                if (vErrors) {
                    vErrors[vErrors.length] = ${err};
                } else {
                    vErrors = [${err}]
                }
            }
        `;

    return templ;
}

export { plugin };
