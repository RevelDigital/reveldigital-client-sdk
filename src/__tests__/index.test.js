import { describe, expect, test } from "vitest"
import { PlayerClient } from "../index"

describe("Test", () => {
    //test.todo("Write more tests!");

    test("Test PlayerClient", async () => {

        const playerClient = new PlayerClient()
        //expect(playerClient).toBeDefined()
        expect(playerClient).toBeInstanceOf(PlayerClient)

        expect(await playerClient.isPreviewMode()).toBe(true)
    });
})