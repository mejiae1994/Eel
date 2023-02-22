export class Vector {
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  static subVector(v1, v2) {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
  }

  static getAngle(v1, v2) {
    return Math.atan2((v1.y) - v2.y, (v1.x) - v2.x);
  }

  static getVelocityAngle(v) {
    return Math.atan2(v.y, v.x);
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  divide(scalar) {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  normalize() {
    const length = this.length();
    if (length !== 0) {
      this.divide(length);
    }
    return this;
  }

  setMag(magnitude) {
    const currentMag = this.length();
    if (currentMag !== 0) {
      this.multiply(magnitude / currentMag);
    }
    return this;
  }

  limit(max) {
    const currentMag = this.length();
    if (currentMag > max) {
      this.divide(currentMag / max);
    }
    return this;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  clone() {
    return new Vector(this.x, this.y);
  }
}

