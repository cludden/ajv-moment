# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="2.0.1"></a>
## [2.0.1](https://github.com/cludden/ajv-moment/compare/v2.0.0...v2.0.1) (2019-01-16)


### Bug Fixes

* fixes broken `now` logic, closes [#4](https://github.com/cludden/ajv-moment/issues/4) ([e3c5be6](https://github.com/cludden/ajv-moment/commit/e3c5be6))



# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [2.0.0]

### Added
- adds `CHANGELOG.md`

### Changed
- changes plugin logic to attach moment to the `self` validation time variable, which allows for plugin use without `passContext` or needing to call validate bound to an external context containing a reference to moment (thanks @epoberezkin)
- refactors codebase to use `babel`

[2.0.0]: https://github.com/GaiamTV/gaia-core-api/compare/v1.0.1...v2.0.0
