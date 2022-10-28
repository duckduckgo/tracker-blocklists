# Using DuckDuckGo's App Tracker Blocklist

The following description explains, at the high-level, how the app blocklist is used by [DuckDuckGo App Tracking Protection](https://spreadprivacy.com/introducing-app-tracking-protection/) beta on Android.

1. Intercept network requests from all apps by utilizing VPN APIs. 
We exclude certain apps from interception, such as those that do not work with VPNs or apps that rely on tracking domains to function.
Our full list of excluded apps can be found in the `unprotectedApps` object here:
https://github.com/duckduckgo/privacy-configuration/tree/main/features/app-tracker-protection.json

2. For each intercepted request, take the hostname of the request (including subdomains) by parsing DNS queries, HTTP, or the TLS SNI. 
Check for a corresponding key in the [trackers](README.md#trackers) object. Continue removing subdomains until a match is found or you no longer have a valid hostname.

    - If no match is found, don't block the request
    - If a match is found, continue to the next step

3. If a match is found: check if the requesting app's package name exists in the [packageNames](README.md#packagenames) object of the blocklist.

    - If the package name exists, compare the owner name of the package to the owner of the tracker.
        - If they match, the request is considered first-party, don't block it.
        - Otherwise, mark the request as third-party and continue to the next step.
    - If the package name does not exist, mark the request as third-party and continue to the next step.

4. Check if there is an exception for the given app/tracker pair as certain apps rely on specific trackers and stop functioning correctly if the tracker is blocked.
Our full list of exceptions can be found in the `appTrackerAllowList` object here:
https://github.com/duckduckgo/privacy-configuration/tree/main/features/app-tracker-protection.json

    - If there are no exceptions, block the request
    - If there is a matching exception, don't block the request

See the function `shouldAllowDomain` in https://github.com/duckduckgo/Android/tree/develop/app-tracking-protection/vpn-impl/src/main/java/com/duckduckgo/mobile/android/vpn/integration/NgVpnNetworkStack.kt for an example of how to use both the blocklist and the exclusions.

---

## Examples

### Tracker with `default: block`

Consider the following tracker

```json
"example-tracker.com": {
    "owner": {
        "name": "Example Tracker",
        "displayName": "Example Tracker"
    },
    "default": "block"
}
```

and the following app/tracker exception:

```json
{
    "domain": "example-tracker.com",
    "packageNames": [
        {
            "packageName": "com.game.app"
        }
    ]
}
```

This tracker above has `default: block`. 
We will block all third-party requests from this tracker unless there is an exception for this tracker within a specific app.

<table>
    <tr><th>App</th><th>App Developer</th><th>Host</th><th>Block</th><th>Reason</th></tr>
    <tr><td><b>com.weather.app</b></td><td><b>Unknown</b></td><td><b>example-tracker.com</b></td><td><b>true</b></td><td><b>default set to 'block'</b></td></tr>
    <tr><td><b>com.example.app</b></td><td><b>Example Tracker</b></td><td><b>example-tracker.com</b></td><td><b>false</b></td><td><b>first-party request</b></td></tr>
    <tr><td><b>com.game.app</b></td><td><b>Unknown</b></td><td><b>example-tracker.com</b></td><td><b>false</b></td><td><b>app/tracker exception match</b></td></tr>
</table>

### Tracker with `default: ignore`

This tracker has `default: ignore`. There are some trackers that cannot be blocked due to breakage.

```json
"image-cdn-example.com": {
    "owner": {
        "name": "Example LTD.",
        "displayName": "Example Site"
    },
    "default": "ignore"
},
```

<table>
    <tr><th>App</th><th>App Developer</th><th>Host</th><th>Block</th><th>Reason</th></tr>
    <tr><td><b>com.weather.app</b></td><td><b>Unknown</b></td><td><b>example-tracker.com</b></td><td><b>false</b></td><td><b>default set to 'ignore'</b></td></tr>
    <tr><td><b>com.example.app</b></td><td><b>Example Tracker</b></td><td><b>example-tracker.com</b></td><td><b>false</b></td><td><b>default set to 'ignore'</b></td></tr>
    <tr><td><b>com.game.app</b></td><td><b>Unknown</b></td><td><b>example-tracker.com</b></td><td><b>false</b></td><td><b>default set to 'ignore'</b></td></tr>
</table>
