import { ethers } from "ethers";
import { EventEmitter } from "events";

const ERC20_ABI = [

    /* methods */
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint)",
    "function balanceOf(address) view returns (uint)",

    /* events */
    "event Transfer(address indexed from, address indexed to, uint amount)",

];

export declare interface ERC20 {

    on(
        event: "transfer",
        listener: (
            from: string,
            to: string,
            amount: ethers.BigNumber,
            event: ethers.Event
        ) => void
    ): void;

}

export class ERC20 {

    private contract: ethers.Contract;
    private cache: {
        name?: string;
        symbol?: string;
        decimals?: ethers.BigNumber;
    } = {};
    private events = new EventEmitter();
    private registeredTransferListener = false;

    constructor(
        provider: ethers.providers.BaseProvider,
        address: string
    ) {
        this.contract = new ethers.Contract(address, ERC20_ABI, provider);
    }

    public async name(): Promise<string> {
        if (!this.cache.name)
            this.cache.name = await this.contract.name();
        return this.cache.name!;
    }

    public async symbol(): Promise<string> {
        if (!this.cache.symbol)
            this.cache.symbol = await this.contract.symbol();
        return this.cache.symbol!;
    }

    public async decimals(): Promise<ethers.BigNumber> {
        if (!this.cache.decimals)
            this.cache.decimals = await this.contract.decimals();
        return this.cache.decimals!;
    }

    private registerTransferListener() {
        if (this.registeredTransferListener)
            return;
        this.contract.on("Transfer", (from, to, amount, event) =>
            this.events.emit("transfer", from, to, amount, event));
    }

    public on(
        event: "transfer",
        listener: (...args: any) => void
    ): void {
        this.events.on(event, listener);
        this.registerTransferListener();
    }

};
