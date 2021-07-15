import { expect } from "chai";
import { greet } from "../src/greet";

describe("greet", () => {
    it("should greet", () => {
        expect(greet("leon")).to.equal("hello leon!");
    });
});
