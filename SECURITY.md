# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.2.x   | Yes       |
| < 0.2   | No        |

## Reporting a vulnerability

Please report suspected security vulnerabilities through [GitHub private security reporting](https://github.com/vahidkaargar/customized-api-client/security/advisories/new) or the contact options available on this repository.

Do **not** open public issues for undisclosed security problems.

Include enough detail for us to reproduce or assess risk (endpoint, SDK version or commit, reproduction steps).

## Releases and supply chain

- Production dependency changes are audited in CI with `npm audit --omit=dev --audit-level=moderate`.
- [Dependabot](https://docs.github.com/en/code-security/dependabot) is configured for npm updates; enable Dependabot security alerts for this repository if they are disabled.
