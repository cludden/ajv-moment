'use strict';

import Ajv from 'ajv';
import * as AjvMoment from '../lib';
import { expect } from 'chai';
import moment from 'moment';
import _ from 'lodash';

describe('ajv-dates', function() {
    const now = moment();
    const ajv = new Ajv();

    before(function() {
        AjvMoment.plugin({ ajv, moment });
    });

    const schemas = [{
        name: 'basic',
        schema: {
            type: 'string',
            moment: true
        },
        tests: [{
            data: new Date().toISOString(),
            result: true
        },{
            data: 'hello',
            result: false
        }]
    },{
        name: 'custom-format',
        schema: {
            type: 'string',
            moment: {
                format: ['MM-DD-YYYY']
            }
        },
        tests: [{
            data: '12-01-2010',
            result: true
        },{
            data: '12/1/2010',
            result: false
        }]
    },{
        name: 'isBefore',
        schema: {
            type: 'object',
            properties: {
                start: {
                    type: 'string',
                    moment: {
                        validate: [{
                            test: 'isBefore',
                            value: {
                                $data: '1/finish'
                            }
                        }]
                    }
                },
                finish: {
                    type: 'string',
                    moment: true
                }
            }
        },
        tests: [{
            data: {
                start: moment().subtract(1, 'milliseconds').toISOString(),
                finish: new Date().toISOString()
            },
            result: true
        },{
            data: {
                start: moment('10/31/2010', 'MM/DD/YYYY').add(1, 'milliseconds').toISOString(),
                finish: moment('10/31/2010', 'MM/DD/YYYY').subtract(1, 'milliseconds').toISOString()
            },
            result: false
        }]
    },{
        name: 'isAfter',
        schema: {
            type: 'object',
            properties: {
                created: {
                    type: 'string',
                    moment: true
                },
                due: {
                    type: 'string',
                    moment: {
                        validate: [{
                            test: 'isAfter',
                            value: {
                                $data: '1/created',
                                manipulate: [
                                    { add: [1, 'days'] },
                                    { set: { hour: 17, minute: 30 } }
                                ]
                            }
                        }]
                    }
                }
            }
        },
        tests: [{
            data: {
                created: moment().subtract(1, 'weeks').toISOString(),
                due:  new Date().toISOString()
            },
            result: true
        },{
            data: {
                created: moment().subtract(30, 'minutes').toISOString(),
                due: new Date().toISOString()
            },
            result: false
        }]

    },{
        name: 'isSameOrAfter',
        schema: {
            type: 'object',
            properties: {
                nested: {
                    type: 'object',
                    properties: {
                        created: {
                            type: 'string',
                            moment: true
                        }
                    }
                },
                due: {
                    type: 'string',
                    moment: {
                        validate: [{
                            test: 'isSameOrAfter',
                            value: {
                                $data: '1/nested/created',
                                manipulate: [
                                    { add: [1, 'weeks'] },
                                    { endOf: ['day'] }
                                ]
                            }
                        }]
                    }
                }
            }
        },
        tests: [{
            data: {
                nested: {
                    created: new Date().toISOString()
                },
                due: moment().add(1, 'weeks').endOf('day').toISOString()
            },
            result: true
        },{
            data: {
                nested: {
                    created: new Date().toISOString()
                },
                due: moment().add(2, 'weeks').toISOString()
            },
            result: true
        },{
            data: {
                nested: {
                    created: new Date().toISOString()
                },
                due: moment().add(1, 'days').endOf('day').subtract(30, 'minutes').toISOString()
            },
            result: false
        }]
    },{
        name: 'isBetween',
        schema: {
            type: 'object',
            properties: {
                start: {
                    type: 'string',
                    moment: true
                },
                middle: {
                    type: 'string',
                    moment: {
                        validate: [{
                            test: 'isBetween',
                            value: [{
                                $data: '1/start',
                                manipulate: [
                                    { add: [1, 'hours'] }
                                ]
                            },{
                                $data: '1/finish',
                                manipulate: [
                                    { subtract: [1, 'hours'] }
                                ]
                            }]
                        }]
                    }
                },
                finish: {
                    type: 'string',
                    moment: {
                        validate: [{
                            test: 'isAfter',
                            value: {
                                $data: '1/start',
                                manipulate: [
                                    { add: [36, 'hours'] }
                                ]
                            }
                        }]
                    }
                }
            }
        },
        tests: [{
            data: {
                start: new Date().toISOString(),
                middle: moment().add(2, 'hours').toISOString(),
                finish: moment().add(2, 'days').toISOString()
            },
            result: true
        },{
            data: {
                start: new Date().toISOString(),
                middle: moment().add(2, 'days').subtract(1, 'hours').subtract(1, 'seconds').toISOString(),
                finish: moment().add(2, 'days').toISOString()
            },
            result: true
        },{
            data: {
                start: new Date().toISOString(),
                middle: moment().add(1, 'hours').subtract(1, 'milliseconds').toISOString(),
                finish: moment().add(2, 'days').toISOString()
            },
            result: false
        },{
            data: {
                start: new Date().toISOString(),
                middle: moment().add(47, 'hours').add(1, 'milliseconds').toISOString(),
                finish: moment().add(2, 'days').toISOString()
            },
            result: false
        }]
    },{
        name: 'complex',
        schema: {
            type: 'object',
            properties: {
                first: {
                    type: 'string',
                    moment: true
                },
                breakpoint: {
                    type: 'string',
                    moment: {
                        validate: [{
                            test: 'isBetween',
                            value: [{
                                $data: '1/first'
                            },{
                                $data: '1/second'
                            }]
                        },{
                            test: 'isSameOrBefore',
                            value: {
                                $data: '1/second',
                                manipulate: [
                                    { subtract: [15, 'seconds' ] }
                                ]
                            }
                        }]
                    }
                },
                second: {
                    type: 'string',
                    moment: {
                        validate: [{
                            test: 'isSameOrAfter',
                            value: {
                                $data: '1/first',
                                manipulate: [
                                    { add: [30, 'minutes'] }
                                ]
                            }
                        }]
                    }
                },
                third: {
                    type: 'string',
                    moment: {
                        validate: [{
                            test: 'isAfter',
                            value: {
                                $data: '1/second'
                            }
                        }]
                    }
                }
            },
            required: [
                'first', 'second', 'third', 'breakpoint'
            ]
        },
        tests: [{
            data: {
                first: now.toISOString(),
                breakpoint: now.clone().add(29, 'minutes').add(45, 'seconds').toISOString(),
                second: now.clone().add(30, 'minutes').toISOString(),
                third: now.clone().add(30, 'minutes').add(1, 'milliseconds').toISOString()
            },
            result: true
        },{
            data: {
                first: now.toISOString(),
                breakpoint: now.clone().add(29, 'minutes').add(45, 'seconds').subtract(1, 'milliseconds').toISOString(),
                second: now.clone().add(30, 'minutes').subtract(1, 'milliseconds').toISOString(),
                third: now.clone().add(30, 'minutes').add(1, 'milliseconds').toISOString()
            },
            result: false
        }]
    }];

    schemas.forEach(function(schema) {
        schema.tests.forEach(function(test, ii) {
            const outcome = test.result === true ? 'pass' : 'fail';
            it(`should ${outcome} validation (${schema.name}, test ${ii})`, function() {
                const momentify = { moment };
                const validate = ajv.compile(schema.schema);
                const e = _.attempt(function() {
                    expect(validate.call(momentify, test.data)).to.equal(test.result);
                });
                if (_.isError(e)) {
                    throw e;
                }
            });
        });
    });
});
