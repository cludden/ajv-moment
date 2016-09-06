# ajv-moment
an [ajv](https://github.com/epoberezkin/ajv) plugin using [moment](https://github.com/moment/moment/) for robust date validation in your json-schemas.



## Installing
```bash
npm install --save ajv moment ajv-moment
```



## Getting Started
```javascript
import Ajv from 'ajv'
import { plugin } from 'ajv-moment'
import moment from 'moment'

// define an ajv instance
const ajv = new Ajv();

// install the plugin. by default, this plugin utilizes the "moment" custom keyword
plugin({ ajv, moment });

// define your schemas using the "moment" keyword
// here we define a schema for an object with two keys (assigned & due)
// each of which must be a valid date string in ISO 8601 format.
// in addition, we specify that the due key must be greater than or
// equal to the assigned date plus 3 days.
const schema = {
    type: 'object',
    properties: {
        assigned: {
            type: 'string',
            moment: true
        },
        due: {
            type: 'string',
            moment: {
                validate: [{
                    test: 'isSameOrAfter',
                    value: {
                        $data: '1/assigned',
                        manipulate: [{
                            add: [3, 'days']
                        }]
                    }
                }]
            }
        }
    },
    required: [
        'assigned', 'due'
    ]
}

// compile your schema using ajv
const validate = ajv.compile(schema);

validate({
    assigned: new Date().toISOString(),
    due: moment().add(24, 'hours').toISOString()
});
// false

validate({
    assigned: new Date().toISOString(),
    due: moment().add(1, 'weeks').toISOString()
});
// true
```



## Schemas
The custom keyword schema definitions can take on many forms. The simplest being the following:

```json
{
    "type": "string",
    "description": "a valid date string in ISO 8601 format",
    "moment": true
}
```

This schema will simply enforce that the provided value is a valid date string in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format.

To specify a custom format, a `format` option can be defined in the schema definition. When a custom format is specified, moment's `strict` parsing option will be enforced.

```json
{
    "type": "string",
    "description": "a valid date string in MM-DD-YYYY format",
    "moment": {
        "format": ["MM-DD-YYYY"]
    }
}
```

Aside from date string formats, this plugin can also perform additional validations using `moment`. The validations are defined in the `validate` subschema keyword and can be used to enforce relative constraints on date strings. See below for some examples.

```json
[
    {
        "type": "string",
        "description": "a valid date string prior to January 1st, 2000 UTC",
        "moment": {
            "validate": [
                {
                    "test": "isBefore",
                    "value": "2000-01-01T00:00:00.000Z"
                }
            ]
        }
    },
    {
        "type": "object",
        "properties": {
            "assigned": {
                "type": "string",
                "description": "a valid date string in ISO 8601 format",
                "moment": true
            },
            "due": {
                "type": "string",
                "description": "a valid date string in ISO 8601 format that is greater than or equal to the assigned date plus 3 days & 30 minutes",
                "moment": {
                    "validate": [
                        {
                            "test": "isSameOrAfter",
                            "value": {
                                "$data": "1/assigned",
                                "manipulate": [
                                    {
                                        "add": [3, "days"]
                                    },
                                    {
                                        "add": [30, "minutes"]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        },
        "required": [
            "assigned",
            "due"
        ]
    },
    {
        "type": "object",
        "properties": {
            "first": {
                "type": "string",
                "description": "a valid date string in ISO 8601 format",
                "moment": true
            },
            "second": {
                "type": "string",
                "description": "a valid date string in ISO 8601 format that is greater than the 'first' attribute by at least 30 minutes",
                "moment": {
                    "validate": [
                        {
                            "test": "isSameOrAfter",
                            "value": {
                                "$data": "1/first",
                                "manipulate": [
                                    {
                                        "add": [30, "minutes"]
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
            "breakpoint": {
                "type": "string",
                "description": "a valid date string in ISO 8601 format that is both between 'first' and 'second' and also prior to 'second' by at least 15 seconds",
                "moment": {
                    "validate": [
                        {
                            "test": "isBetween",
                            "value": [
                                {
                                    "$data": "1/first"
                                },
                                {
                                    "$data": "1/second"
                                }
                            ]
                        },
                        {
                            "test": "isSameOrBefore",
                            "value": {
                                "$data": "1/second",
                                "manipulate": [
                                    {
                                        "subtract": [15, "seconds"]
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
            "third": {
                "type": "string",
                "description": "a valid date string prior in ISO 8601 format that after 'second'",
                "moment": {
                    "validate": [
                        {
                            "test": "isAfter",
                            "value": {
                                "$data": "1/second"
                            }
                        }
                    ]
                }
            }
        },
        "required": [
            "first",
            "second",
            "breakpoint",
            "third"
        ]
    }
]
```



## Testing
run all tests  
```javascript
npm test
```



## Contributing
1. [Fork it](https://github.com/cludden/ajv-moment/fork)
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request



## License
Copyright (c) 2016 Chris Ludden.
Licensed under the [MIT license](LICENSE.md).
