import { completionCoin } from "../src/common/coin"
import { getCoinDecimals } from "../src/common/price"

describe("common utilities", () => {
  describe("completionCoin", () => {
    it("pads short Sui package addresses in coin types", () => {
      expect(completionCoin("0x2::sui::SUI")).toBe(
        "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
      )
    })

    it("leaves non-Sui type strings unchanged", () => {
      expect(completionCoin("sui::SUI")).toBe("sui::SUI")
    })

    it("leaves overlong package addresses unchanged", () => {
      const overlongAddress = `0x${"1".repeat(65)}::coin::COIN`

      expect(completionCoin(overlongAddress)).toBe(overlongAddress)
    })
  })

  describe("getCoinDecimals", () => {
    it("returns metadata decimals when available", async () => {
      const client = {
        getCoinMetadata: jest.fn().mockResolvedValue({ decimals: 6 }),
      }

      await expect(getCoinDecimals(client as never, "0x2::sui::SUI")).resolves.toBe(6)
    })

    it("falls back to 9 decimals when metadata lookup fails", async () => {
      const client = {
        getCoinMetadata: jest.fn().mockRejectedValue(new Error("RPC unavailable")),
      }

      await expect(getCoinDecimals(client as never, "0x2::sui::SUI")).resolves.toBe(9)
    })
  })
})
