import fs from "fs/promises";
import yaml from "yaml";

const DEFAULT_WS_RPC_URL = "ws://localhost:8546";
const DEFAULT_INFLUX_URL = "http://localhost:8086";
const DEFAULT_INFLUX_ORG = "curly-umbrella";
const DEFAULT_INFLUX_BUCKET = "curly-umbrella";
const DEFAULT_INFLUX_FLUSH_INTERVAL = 10_000 /* ms */;

export type Config = {
    wsRpcUrl: string;
    influx: {
        url: string;
        org: string;
        bucket: string;
        token: string;
        flushInterval: number;
    };
    erc20: {
        tokenAddresses: string[];
    };
};

export const loadConfig = (path: string) =>
    new Promise<Required<Config>>(async (resolve, reject) => {
        return fs
            .readFile(path, "utf-8")
            .then(str => yaml.parse(str))
            .then(obj => {
                if (!obj.influx?.token)
                    return reject(":(");
                if (!obj.erc20?.tokenAddresses)
                    return reject(":(");

                if (!obj.wsRpcUrl)
                    obj.wsRpcUrl = DEFAULT_WS_RPC_URL;
                if (!obj.influx.url)
                    obj.influx.url = DEFAULT_INFLUX_URL;
                if (!obj.influx.org)
                    obj.influx.org = DEFAULT_INFLUX_ORG;
                if (!obj.influx.bucket)
                    obj.influx.bucket = DEFAULT_INFLUX_BUCKET;
                if (!obj.influx.flushInterval)
                    obj.influx.flushInterval = DEFAULT_INFLUX_FLUSH_INTERVAL;

                resolve(obj);
            });
    });
