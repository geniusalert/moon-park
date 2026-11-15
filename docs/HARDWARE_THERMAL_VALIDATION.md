# Hardware thermal calibration and validation

Moon Park can compare its single-node spacecraft thermal model with supplied component measurements. No actual hardware measurements are bundled. The synthetic cooling fixture checks software and always reports that status.

NASA describes thermal-model correlation using thermal-vacuum measurements, test boundary conditions and sensor locations. Entered error limits belong to the study and are not NASA qualification criteria. [NASA thermal engineering guidebook](https://ntrs.nasa.gov/api/citations/20220006584/downloads/NASAPassiveThermalGuidebookv5%201Public.pdf)

## Using the workflow

1. Expand **Panel, storage and thermal assumptions** and **Validate a spacecraft component with hardware measurements**.
2. Download the measurement template and replace its placeholders with measured records and documented component properties.
3. Import the JSON. Inspect calibration and separate validation errors, sensor uncertainty, numerical refinement and candidate-grid boundaries.
4. Use **Apply fitted thermal properties** to update the current engineering assumptions deliberately.
5. Export the hardware report or full workspace. Restoration verifies the input identity and recomputes the analysis from the original records.

Analysis runs in a local browser worker and supports cancellation. Clearing evidence removes the loaded study. Exported workspaces contain the supplied measurement records.

## Input records

Use format moon-park-hardware-thermal-test, schemaVersion 1, physicalTarget spacecraft-component and temperatureUnit K. Identify the hardware, sensor, sensor location, sensor calibration reference and sensor uncertainty.

Declare evidenceType measured only for observations. Mathematical records use synthetic. Input authenticity is user-declared.

Every run needs a unique runId, sourceReference and explicit calibration or validation role. Reserve separate validation records before fitting. Exact duplicate records are rejected. Each run starts at elapsedSeconds zero with an initial measured temperature and at least three later measurements.

| Row field | Meaning |
|---|---|
| elapsedSeconds | Seconds after the start of the run |
| temperatureK | Measured sensor temperature in Kelvin |
| irradianceWm2 | Incident irradiance projected onto the collecting surface |
| internalHeatW | Internal heat deposited in the thermal node |
| electricalW | Electrical power extracted from the thermal node |
| groundTemperatureK | Conductive/radiative interface temperature |
| skyTemperatureK | Effective radiative temperature of the remaining surroundings or chamber shroud |

Forcing is constant until the next record. Include rows for changed heater settings and boundaries. The final row supplies the last temperature observation.

## Model and parameter fitting

Mission estimates and hardware comparisons share the same heat-balance integrator. It includes absorption, internal heating, electrical extraction, radiation to two surroundings and linear conduction. Hardware runs use backward Euler with steps of at most ten seconds.

Supply areaM2, absorptivity, emissivity, radiatingAreaM2, conductanceWK, groundViewFactor and heatCapacityJK. Optional fitGrids can contain up to seven candidates each for at most two of heatCapacityJK, emissivity and conductanceWK.

Only calibration records select parameters, using sample-weighted RMSE. Candidate order breaks exact ties. Validation records are evaluated afterward. The initial measured temperature initializes each run and is excluded from error statistics.

Reports include RMSE, bias, mean absolute error, maximum error, user-selected maxRMSEK/maxAbsErrorK limits, candidate-grid boundary warnings and a separate five-second integration check. Sensor uncertainty is reported independently. No statistical confidence interval is inferred.

The receipt contains original records, input SHA-256, model version, fitted properties and validation forcing ranges. A pass describes only the declared component, sensor and tested conditions. Applying properties does not establish accuracy under untested lunar conditions. The single-node model omits internal gradients, nonlinear contact changes, aging and temperature-dependent thermal properties.

Limits are 12 runs, 12,000 records and 30 days of combined run duration. Calibration is bounded to at most 49 parameter combinations.

## Diviner and hardware evidence

The Diviner report compares measured lunar-surface temperatures with a published regolith reference model. Its residuals and unmatched assumptions are documented. Spacecraft calibration requires component measurements. Surface maps cannot establish spacecraft temperature accuracy.

## Software checks

The synthetic fixture uses an independent analytical radiative-cooling solution, with different calibration and validation initial temperatures. Tests recover known heat capacity, verify that validation data cannot affect the fit, reject duplicate/invalid records and reject an unfilled measurement template. Synthetic results never receive a hardware-validation pass.

## Recorded acceptance — 14 November 2026

108 JavaScript tests and 51 Python tests passed. Browser checks exercised synthetic import, cancellation/retry, deliberate property application, mission-range warnings, export and restoration. Re-export reproduced the original hardware study and engineering settings. Altered measurement inputs were rejected before changing properties. A forged saved hardware pass was discarded and recomputed as a synthetic software check.

The analytical cooling fixture recovered 1000 J/K heat capacity. Its separate validation run had 0.0754 K RMSE and 0.0974 K maximum error. These are numerical software results, with no physical hardware measurements. Synthetic test data were cleared and illustrative defaults restored after acceptance.

The user confirmed that hardware measurements are unavailable. Hardware temperature accuracy remains unvalidated. The complete workflow and template are ready for actual component measurements. [Machine-readable verification](hardware-thermal-verification.json)
