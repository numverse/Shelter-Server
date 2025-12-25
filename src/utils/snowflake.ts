// Snowflake ID Generator
// 64-bit ID: timestamp (42 bits) | worker (5 bits) | process (5 bits) | sequence (12 bits)
const EPOCH = 1700000000000n; // Custom epoch: Nov 14, 2023
const WORKER_ID = BigInt(process.env.WORKER_ID || "1");
const PROCESS_ID = BigInt(process.env.PROCESS_ID || "1");

let sequence = 0n;
let lastTimestamp = -1n;

export function generateSnowflake(): string {
  let timestamp = BigInt(Date.now());

  if (timestamp === lastTimestamp) {
    sequence = (sequence + 1n) & 4095n; // 12 bits max
    if (sequence === 0n) {
      // Wait for next millisecond
      while (timestamp <= lastTimestamp) {
        timestamp = BigInt(Date.now());
      }
    }
  } else {
    sequence = 0n;
  }

  lastTimestamp = timestamp;

  const id = ((timestamp - EPOCH) << 22n)
    | ((WORKER_ID & 31n) << 17n)
    | ((PROCESS_ID & 31n) << 12n)
    | sequence;

  return id.toString();
}

// Parse snowflake to get timestamp
export function getSnowflakeTimestamp(snowflake: string): Date {
  const id = BigInt(snowflake);
  const timestamp = (id >> 22n) + EPOCH;
  return new Date(Number(timestamp));
}
