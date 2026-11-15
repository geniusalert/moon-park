# Airless horizon and solar elevation integration

Verified 13 November 2026 in the current local source build. The preserved 0.16 archive predates this update.

The scientific worker already uses straight, unrefracted rays on the curved Moon. The terrain calculation uses actual radial DEM elevations and does not insert the datum sphere as an obstruction inside a crater. Global reference mode uses the analytic tangent to its declared sphere. Horizons responses with an incorrect atmospheric treatment are rejected. See the retained airless geometry and Horizons observer tests.

This update connects the existing geometry details to live inspection. A dashed 0° radial-horizontal reference is shown alongside the green skyline. The Sun's elevation, signed clearance, visible disc fraction and horizontal centre-ray projection appear together and follow replay and scenario selection. The sphere explanation explicitly identifies the reference radius and omitted actual ground. Prepared examples retain their earlier model; the panel says so.

Mission results now include a source-derived solarGeometry summary. The comparison and brief show the mean unblocked horizontal projection. Each bin contributes max(0, sin(elevation)) times its duration if the centre clears the horizon, otherwise zero. The final bin is clipped to the mission endpoint. The mean is normalized by mission duration. Visible disc fraction and the 50% mission sunlight threshold remain separate. Partial-disc irradiance is not approximated by multiplying these quantities.

The metric expresses geometric projection relative to normal incidence. It predicts neither watts nor energy; panel orientation, hardware, thermal behavior, eclipses and electrical conversion remain omitted. A visible Sun below the local horizontal gives zero horizontal centre-ray projection. Low positive elevation can also yield zero when terrain blocks the Sun.

Verification: 83 JavaScript tests and 51 Python tests pass. New tests cover 30°/90° incidence, positive elevation behind terrain, negative elevation above a depressed horizon, grazing centre, invalid inputs and clipped interval integration. Browser inspection confirmed the prepared example at 1.27° elevation shows 2.2% projection and 100% disc visibility; last-sample replay changes these to 1.03° and 1.8%. The airless panel opens, the horizon reference is present, and no browser errors were recorded. Screenshot: airless-solar-integration.jpg. Human understanding and independent scientific review remain separate.

References: [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html), [Horizons API AIRLESS option](https://ssd-api.jpl.nasa.gov/doc/horizons.html), [NASA Artemis lighting considerations](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-001-artemis-lighting-considerations.pdf). These document the source settings and lighting context; software tests do not establish absolute physical accuracy.
