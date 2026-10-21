/** Real markets each page is built around (see research/seer-data.md). */
export const IDS = {
  rebrand: { chainId: 100, id: "0xe7850b0d928aa40ab8732bd323fa4f6ef3c24b8a" },
  jobBoard: [
    { chainId: 100, id: "0x8b3c7f3f09f6a85353926d8ee0f12decc1c9a5e8" },
    { chainId: 100, id: "0xf6a42af200c181df45e0f3fd49d58f5d57bb7d35" },
    { chainId: 100, id: "0x144364db8edd6225248fe9d02f77ecc3ec0e4c4c" },
  ],
  devcon: { chainId: 100, id: "0xc2b8e25675db9977ad14bca62b655e4aa6b36683" },
  futarchyLive: { chainId: 1 as const, id: "0x0d78b95fca9f3e1b588271a330b0d6f731ec38aa" },
  futarchyResolved: { chainId: 100 as const, id: "0x4120de9931fd29c8a6effea4df57a7c8760c1677" },
} as const;
