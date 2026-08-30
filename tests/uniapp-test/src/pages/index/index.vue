<template>
    <view>
        <view v-for="(item, i) of data" :key="i" style="margin-bottom: 16px;">
            <view style="color: #303133; font-size: 24px;">{{ item[0] }}</view>
            <view v-for="(record, j) of item[1]" :key="j" style="margin-bottom: 4px;">
                <view style="padding-left: 16px;">
                    <text style="padding-right: 8px;">
                        <text v-if="record[0]" style="color: green;">✔</text>
                        <text v-else style="color: red;">✖</text>
                    </text>
                    <text style="color: #909399">{{ record[1] }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script lang="ts">
import "../../mphttpx";
// @ts-ignore
import { Notify, testConfig } from  "../../../../utils";

export default {
    data() {
        return {
            data: [] as [string, [boolean, string][]][],
        };
    },

    mounted() {
        Notify.subscribe((v: [string, [boolean, string][]][]) => { this.data = v; });

        uni.request({
            url: `${testConfig.api_prefix}/ping`,
            timeout: 3000,
            fail() {
                setTimeout(
                    () => {
                        console.warn("MPHTTPX: before testing fetch, start the mock server first and don't verify valid domain names.");
                    },
                    testConfig.timeout + 1000
                );
            },
        });
    },
};
</script>

<style>

</style>
