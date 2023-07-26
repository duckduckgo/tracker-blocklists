# DuckDuckGo's Web Tracker Blocklist

The web tracker blocklist is built using data from our [Tracker Radar](https://github.com/duckduckgo/tracker-radar). Questions or issues with tracker blocking in DuckDuckGo apps and extensions should be reported in the [Privacy Configuration](https://github.com/duckduckgo/privacy-configuration).
The trackers included in the blocklist are identified by looking for common third-party requests from [Tracker Radar](https://github.com/duckduckgo/tracker-radar) that are setting cookies or using browser APIs in a way that suggests fingerprinting.

## Questions

- **Where are the blocklists?** Blocklists can be found [here](https://github.com/duckduckgo/tracker-blocklists/web) by version and platform.
- **Where can I find the code that generates the blocklists?** The code to generate blocklists from the [Tracker Radar data set](https://github.com/duckduckgo/tracker-radar) is not yet open source, but coming soon.
- **How do I use the blocklist?** See [examples](EXAMPLES.md) file that gives an overview of the blocking algorithm and lists couple of examples.

# Format

The blocklist is in JSON format and consists of four main objects:

- [trackers](#trackers)
- [entities](#entities)
- [domains](#domains)
- [cnames](#cnames)

## Trackers

Trackers are grouped by their domain (based on [Public Suffix List](https://publicsuffix.org/list/) and [Tracker Radar Suffix Additions](https://github.com/duckduckgo/tracker-radar/blob/main/build-data/static/pslExtras.json)).

Each tracker contains the following fields:

|domain|The domain of the tracker|
|:-|:-|
|__owner__|__Entity (usually a company) that controls this tracker__|
|__fingerprinting__|__Likelihood this tracker is fingerprinting [0-3]__|
|__cookies__|__Percentage of sites that have cookies set by this tracker__|
|__prevalence__|__Percentage of sites that request this tracker__|
|__default__|__The default behavior when blocking this tracker [block or ignore[^1]]__|
|__rules__|__Resources to match for a given tracker__|
|__categories__|__List of [categories](https://github.com/duckduckgo/tracker-radar/blob/main/docs/CATEGORIES.md) assigned to this tracker__|

### domain

The domain that should be matched against third-party requests to identify the request as being associated with a known tracker.

### owner

[Entity](#entities) (usually a company) that controls each tracker. Each entity has a corresponding [entity file](https://github.com/duckduckgo/tracker-radar/tree/main/entities) in Tracker Radar.
Entities have the following fields defined:

|name|The name of the entity|
|:-|:-|
|__displayName__|__A shortened entity name without company suffixes__|

### prevalence [0-1]

The decimal percent of sites that request this third-party tracker.

### cookies [0-1]

The decimal percent of sites that have cookies set by this third-party tracker.

### fingerprinting [0-3]

The likelihood this tracker is using browser APIs to uniquely identify users.

|0|No use of browser APIs|
|:---|:---|
| __1__ | __Some use of browser APIs, but not obviously for tracking purposes__ |
| __2__ | __Use of many browser APIs, possibly for tracking purposes__ |
| __3__ | __Excessive use of browser APIs, almost certainly for tracking purposes__ |

### default [block, ignore]

The default behavior used when no matching rules are found.

|Default|rules?|Action|
|-|-|-|
|__block__|__no__|__All third-party requests from this tracker are blocked__|
|__block__|__yes__|__If a rule was matched then follow the rule action, otherwise blocked__|
|__ignore__|__yes__|__If a rule was matched then follow the rule action. If no action exists then block the request. Allow all other requests to load[^1]__|
|__ignore__|__no__|__Do not block[^1]__|

### rules

An optional array of objects containing regexes to match against the full URL of third-party requests made to this domain. A matching rule takes priority over the tracker default action.

|rule|Regex to match against the full tracker URL
|:-|:-|
|__fingerprinting__|__see [fingerprinting](#fingerprinting-0-3)__|
|__cookies__|__see [cookies](#cookies-0-1)__|
|__surrogate__|__Certain tracking scripts are implemented in a way that attaches function calls to page elements. When these scripts are blocked, they break sites. In order to block these trackers while still maintaining site functionality, we redirect the requests to surrogate code that replaces all of their functions with no-ops. This field contains the file name of the [replacement code](https://github.com/duckduckgo/tracker-surrogates) to serve instead of blocking__|
|__exceptions__|__Optional object listing types and domains to not block on__|
|__action__|__Optional action to apply other than blocking__|

**exceptions**

An optional object that can contain `domains` or `types` arrays. Do not block the tracker request if there is a `domains` or `types` match. In cases where the exceptions object contains both `domains` and `types` both must match.

|domains|An array of domains to match against the site requesting the tracker. Do not block in cases where the site domain matches an entry in the `domains` array|
|:-|:-|
|__types__|__An array of [resource types](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType) to match against the tracker request resource type. Do not block in cases where the tracker resource type matches an entry in the `types` array__|

**action**

An optional field listing an action to take when matching on the rule other than blocking. The `action` field can also be used to switch a matched rule to a non-blocking rule by setting `action: ignore`[^1].

## Entities

The entities object contains an entry for each of the trackers contained in the blocklist and comes directly from the [entity data](https://github.com/duckduckgo/tracker-radar/tree/main/entities) in Tracker Radar.

## Domains

The domains object is a mapping of all entity properties to entity name. This is used for quick lookup of the site owner for determining if a request is first or third-party.

## CNAMEs

Used for [CNAME cloaking protection](https://help.duckduckgo.com/duckduckgo-help-pages/privacy/web-tracking-protections/#cname-cloaking-protection). The cnames object maps a first-party subdomain that has a DNS CNAME redirecting to a third-party tracker.

[^1]: Other [privacy protections](https://help.duckduckgo.com/duckduckgo-help-pages/privacy/web-tracking-protections/) apply to non-blocked trackers
