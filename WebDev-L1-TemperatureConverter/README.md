# Temperature Converter

OIBSIP - Web Development and Designing - Level 1 - Task 3

A web tool that converts a temperature between Celsius, Fahrenheit and Kelvin.

## Built with
- HTML5
- CSS3
- Vanilla JavaScript (no libraries)

## Checklist
- Number input. Text that is not a number gets an error message, while typing and on Convert
- Unit selector: Celsius, Fahrenheit or Kelvin (radio buttons)
- All three units are shown at the same time in the result area
- Convert button (Enter key also works)
- Result with the correct unit labels, rounded to 2 decimals
- Absolute zero check: -273.15 °C, -459.67 °F or 0 K is the lowest allowed value
- Centred layout with clear labels
- Extra: a thermometer with a bulb that fills from -50 °C to 100 °C
- Extra: numbers count up to the result
- Extra: the background glow and moving particles change with the temperature (snow when cold, sparks when hot)
- Extra: example buttons (freezing, room, body, boiling, absolute zero)
- Extra: a short label for the temperature, like "Comfortable" or "Very hot"

## Formulas
- Celsius to Fahrenheit: C x 9/5 + 32
- Fahrenheit to Celsius: (F - 32) x 5/9
- Celsius to Kelvin: C + 273.15

The code changes every input to Kelvin first, then from Kelvin to the other units.

## How to run
Open `index.html` in any browser.
