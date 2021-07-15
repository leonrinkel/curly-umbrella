import { ethers } from "ethers";
import process from "process";
import { loadConfig } from "./config";
import { ERC20 } from "./erc20";
import { InfluxDB, Point } from "@influxdata/influxdb-client";

const DEFAULT_CONFIG_PATH = "config.yml";

const TRANSFER_MEASUREMENT_NAME = "transfer";
const TRANSFER_MEASUREMENT_TAG_BLOCK_NUMBER = "block_number";
const TRANSFER_MEASUREMENT_TAG_TRANSACTION_HASH = "transaction_hash";
const TRANSFER_MEASUREMENT_TAG_NAME = "name";
const TRANSFER_MEASUREMENT_TAG_SYMBOL = "symbol";
const TRANSFER_MEASUREMENT_TAG_FROM = "from";
const TRANSFER_MEASUREMENT_TAG_TO = "to";
const TRANSFER_MEASUREMENT_FIELD_AMOUNT = "amount";

(async () => {

    const configPath = process.env.CONFIG_PATH || DEFAULT_CONFIG_PATH;
    const config = await loadConfig(configPath);

    const influx = new InfluxDB({
        url: config.influx.url, token: config.influx.token });
    const writeApi = influx.getWriteApi(
        config.influx.org, config.influx.bucket, undefined,
        { flushInterval: config.influx.flushInterval }
    );

    const provider =
        new ethers.providers.WebSocketProvider(config.wsRpcUrl);

    config.erc20.tokenAddresses
        .forEach(async address => {
            const token = new ERC20(provider, address);

            const name = await token.name();
            const symbol = await token.symbol();
            const decimals = await token.decimals();

            token.on("transfer", async (from, to, amount, event) => {
                const block = await event.getBlock();
                const formattedAmount =
                    ethers.utils.formatUnits(amount, decimals);

                const point = new Point(TRANSFER_MEASUREMENT_NAME);
                point
                    .timestamp(new Date(block.timestamp * 1000))
                    .tag(TRANSFER_MEASUREMENT_TAG_BLOCK_NUMBER, `${event.blockNumber}`)
                    .tag(TRANSFER_MEASUREMENT_TAG_TRANSACTION_HASH, event.transactionHash)
                    .tag(TRANSFER_MEASUREMENT_TAG_NAME, name)
                    .tag(TRANSFER_MEASUREMENT_TAG_SYMBOL, symbol)
                    .tag(TRANSFER_MEASUREMENT_TAG_FROM, from)
                    .tag(TRANSFER_MEASUREMENT_TAG_TO, to)
                    .floatField(TRANSFER_MEASUREMENT_FIELD_AMOUNT, formattedAmount);
                writeApi.writePoint(point);
            });
        });

})();
