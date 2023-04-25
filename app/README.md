# DuckDuckGo's App Tracker Blocklist

The app tracker blocklist is used by [DuckDuckGo App Tracking Protection](https://spreadprivacy.com/app-tracking-protection-open-beta/), currently available in beta on Android only.
We build this list by interacting with popular Android apps and identifying common third-party requests that are sharing personal data, unique identifiers, or other information that could be used for fingerprinting.
In the future, we plan to make the data and the tools used for data collection public.
Questions or issues with tracker blocking in DuckDuckGo apps and extensions should be reported in the [Privacy Configuration](https://github.com/duckduckgo/privacy-configuration).

## Questions

- **Where are the blocklists?**
  - [android-tds.json](android-tds.json) is the blocklist used by [DuckDuckGo App Tracking Protection](https://spreadprivacy.com/app-tracking-protection-open-beta/) beta on Android.
- **Where can I find the code that generates the blocklists?** The code to generate blocklists is not yet open source but coming soon.
- **Are there any exceptions that should be applied to the blocklist?** 
We exclude certain apps from protection if we find that they do not work with VPNs or rely on tracking domains to function. 
Our full list of excluded apps can be found in the `unprotectedApps` object [here](https://github.com/duckduckgo/privacy-configuration/tree/main/features/app-tracker-protection.json). 
Note that users can override this list by enabling or disabling protection for individual apps.
In addition, some apps rely on very specific trackers.
For such apps, we exclude the specific app/tracker pairs as listed in the `appTrackerAllowList` object [here](https://github.com/duckduckgo/privacy-configuration/tree/main/features/app-tracker-protection.json). 
- **How do I use the blocklist?** See [examples](EXAMPLES.md) file that gives an overview of the blocking algorithm and lists a couple of examples.

# Format

The blocklist is in JSON format and consists of three main objects:

- [trackers](#trackers)
- [packageNames](#packagenames)
- [entities](#entities)

## Trackers

Trackers are grouped by their domain (based on [Public Suffix List](https://publicsuffix.org/list/) and [Tracker Radar Suffix Additions](https://github.com/duckduckgo/tracker-radar/blob/main/build-data/static/pslExtras.json)).

The domain should be matched against outgoing requests to identify tracking attempts.

Each tracker contains the following fields:
<table>
    <tr><td><b>owner</b></td><td><b>Entity (usually a company) that controls this tracker</b></td></tr>
    <tr><td><b>default</b></td><td><b>The default behavior when blocking this tracker [block or ignore]</b></td></tr>
</table>

### owner

[Entity](#entities) (usually a company) that controls each tracker. Each entity has a corresponding [entity file](https://github.com/duckduckgo/tracker-radar/tree/main/entities) in Tracker Radar.
Entities have the following fields defined:
<table>
    <tr><td><b>name</b></td><td><b>The name of the entity</b></td></tr>
    <tr><td><b>displayName</b></td><td><b>A shortened entity name without company suffixes</b></td></tr>
</table>

### default [block, ignore]

The default behavior used.

<table>
    <tr><th>Default</th><th>Action</th></tr>
    <tr><td><b>block</b></td><td><b>All third-party requests from this tracker are blocked</b></td></tr>
    <tr><td><b>ignore</b></td><td><b>Do not block</b></td></tr>
</table>

## PackageNames

A list of Android package names developed by entities that also engage in tracking.
Each package name here comes with the corresponding developer name as found in Tracker Radar [entity data](https://github.com/duckduckgo/tracker-radar/tree/main/entities).

## Entities

The entities object contains an entry for each of the trackers found in the blocklist and contains a single field:

<table>
    <tr><td><b>signals</b></td><td><b>The type of data the tracker collects (e.g. gps_coordinates)</b></td></tr>
</table>

### signals

The type of data the tracker is known to collect. Current list of possible values:

__Personal__:
  - first_name: first name as entered into a form within the app
  - last_name: last name as entered into a form within the app
  - email_address: email address

__Location__:
  - postal_code: postal code either as entered into a form or extracted from GPS location
  - gps_coordinates: GPS coordinates  
  - city: city either as entered into a form or extracted from GPS location

__Identifiers__:
  - AAID: Android Advertising ID
  - unique_identifier: any unique identifier that can be set and shared across apps
  - cookies: any cookies set/received
  - local_ip: local IP of the device

__Fingerprinting__:
  - platform: platform of the device (e.g. "Android")
  - os_version: operating system (Android) version
  - os_build_version: build version of the operating system
  - device_make: device brand
  - timezone: time zone
  - device_free_storage: how much free storage remains on the device
  - device_total_storage: how much total storage the device has
  - external_free_storage: how much free external storage remains
  - external_total_storage: how much total external storage the device has
  - device_free_memory: how much free memory (RAM) the device has
  - device_total_memory: how much total memory (RAM) the device has
  - device_language: language of the device
  - accelerometer_data: accelerometer data
  - rotation_data: rotation of the device
  - device_orientation: orientation of the device
  - device_screen_density: density of the device screen
  - device_volume: current volume
  - device_connectivity: connectivity status
  - wifi_ssid: WiFi network name  
  - device_charging_status: is the device charging or not
  - device_battery_level: battery level of the device
  - cpu_data: CPU usage of the device
  - app_name: name of an installed app
  - install_date: installation date of the app
  - device_name: device name
  - device_font_size: font size of the device
  - screen_brightness: screen brightness
  