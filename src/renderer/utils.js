/**
 * Constrain a number to a minimum and maximum value.
 * @param  {Number} min
 * @param  {Number} value
 * @param  {Number} max
 * @return {Number}
 */
export function constrain(min, value, max) {
  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  } else {
    return value;
  }
}
