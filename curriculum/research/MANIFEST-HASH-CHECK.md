# Manifest hash check: canonical-import-manifest.json

Date: 2026-11-03. Checked file: `curriculum/import/canonical-import-manifest.json` (not modified).

## Method

`build-canonical-import-manifest.py` computes `hashlib.sha256` over the raw bytes of each file (`sha256_file`, opened in `rb`). Two hashes are stored per entry: `canonicalSha256` for the file located under `shared/` or `courses/` (exactly one match required), and `readySourceSha256` for `lessons/ready/<sourceFile>`. This check recomputed both with the same method. The check script lives in `/tmp/mcheck/check.py`, outside the repo.

## Counts

| Item | Count |
|---|---|
| Manifest entries | 216 |
| Unique sourceIds (index and manifest agree, no extras or gaps) | 216 |
| canonicalSha256 matches | 7 |
| canonicalSha256 mismatches | 209 |
| readySourceSha256 matches | 216 |
| readySourceSha256 mismatches | 0 |
| Canonical file missing or not found exactly once | 0 |
| Ready file missing | 0 |

The earlier audit reported 180 of 216 mismatches. The recomputed figure is 209 of 216 canonical hashes mismatched and 0 of 216 ready hashes mismatched, for 209 mismatches total across 432 hashes. The two figures do not agree, so the earlier audit may have used a different method or file set. This was not reconciled.

## Regeneration test

The builder was run in a scratch copy of `curriculum/` (`/tmp/mcheck/copy`), not in the repo.

- Exit status 0, 216 lessons, 216 unique sourceIds, no duplicates.
- Two consecutive runs produced byte-identical output, so the script is deterministic.
- Diff against the committed manifest: 209 lines, all `canonicalSha256` values. No other field changed.
- Conclusion: the builder regenerates cleanly. Running it would update the 209 canonical hashes to the current file contents and change nothing else. It was not run against the repo, per the task.

Note: regenerating changes the manifest to match current files. It does not say whether the canonical files changed intentionally, so that should be confirmed before the new manifest is adopted.

## Matching entries (canonical hash OK)

- C03-L03 (shared/cleaning/C03-L03.json)
- F17-L03 (shared/cleaning/F17-L03.json)
- additional-specialist-services-L01 (shared/operations/additional-specialist-services-L01.json)
- additional-specialist-services-L10 (shared/team/additional-specialist-services-L10.json)
- additional-specialist-services-L12 (shared/quality/additional-specialist-services-L12.json)
- custom-eco-cleaning-products-L03 (shared/chemicals/custom-eco-cleaning-products-L03.json)
- custom-eco-cleaning-products-L10 (shared/chemicals/custom-eco-cleaning-products-L10.json)

## Mismatched canonical hashes (209)

| # | sourceId | canonicalFile | manifest sha256 | current sha256 |
|---|---|---|---|---|
| 1 | C01-L01 | `shared/induction/C01-L01.json` | `9042bc038dccc462aa9696d142dc13ed3bc79f91ee57ddf4e7407b3950a41a9f` | `ce728937f243556e94fcacce7075a690873f0e08ea103768fd7805c58504dfc3` |
| 2 | C01-L02 | `shared/induction/C01-L02.json` | `f93d5f9cf76dcb8a99e9f7826b1e2e850bf1a42b2d453d5a024530f8de85257e` | `3dc28fe808353f7290da3c8ea12371e2d85d51ad0ede3d7e5749d6a51469a459` |
| 3 | C01-L03 | `shared/induction/C01-L03.json` | `222091d459268fba5d35036388a75b6f9ae0999d7b0daf84a994e7b9754555b9` | `42c909427145f1ea65af4893b43ffd18f0f6cf0e6bb53b65b5c3623906889c9e` |
| 4 | C02-L01 | `shared/job-management/C02-L01.json` | `d23bcbb8cc6579669f9400ffb36dd08b5db12fb41343fee9ff71a370993dc930` | `b56eee8962d129735d7adfa85b1de3d96df1d7dd88f553a960a8f48ad208f38b` |
| 5 | C02-L02 | `shared/job-management/C02-L02.json` | `5b8358b0ef0cfa343a496fd98a84902fc73302730411ae6afdcd26738fbe9ffd` | `a0dbae5773273de9e2111780e6a5ca42cde5186d1777f7ce358e664aa6963cdf` |
| 6 | C02-L03 | `shared/job-management/C02-L03.json` | `1540752c71863a466d95dd5eae2d2b6a3a85b7d3b12d1795f18fb78370cfe1bb` | `babea966fbe8df77ffe53bfe759db30a5ed70a140e93f9d6d9418e39ee2548bf` |
| 7 | C03-L01 | `shared/cleaning/C03-L01.json` | `8c4752851d47c48f50abaac7dd5c51e5ab5f0da49d31594361a02d4a50d7b90a` | `2689547e0ae4541715f29aad4d5f8bd916f7d8d51f86f777c12948ebdfc980e1` |
| 8 | C04-L01 | `shared/cleaning/C04-L01.json` | `7951dcad3fa5968b25a8b38875613554dc22af28decb04dd1a41a543f8ec2cab` | `da32fc57ed118004ee0af5bef7480c1eeaaa593616ddcbb9e6448354bf4f71e8` |
| 9 | C04-L03 | `shared/cleaning/C04-L03.json` | `5d8652bceed312dc8506679b502da60b10a00dda499148c06344d488cd499085` | `ca9be3350c4e1990b52ee7d2b8b366d41883c9db9b1f1c8dba3ad021e2ae2f86` |
| 10 | C05-L01 | `shared/chemicals/C05-L01.json` | `4cd4a9a1a8adff75bd530203add9e9d5abc44503a63779c3ebbc3e052b73fa80` | `eba5b92223c9c5c534d6313e1d58efe9fc9f4879d089d45edab3714f53b62501` |
| 11 | C05-L02 | `shared/chemicals/C05-L02.json` | `2659199be40386a72a190a5844fb22a39551fc5990bafd74a48ec7ca1a6412ce` | `c9ea8d89849dc44093e0363257956eba641962a0185718884bab0ca9d28daadf` |
| 12 | C05-L03 | `shared/equipment/C05-L03.json` | `672aaf892d16c69ee5619a0c5a90318c1d53c1216d8e8fa7a7f4a6e41f20d185` | `d588e32616ef6e6ced866b2f22e98e395fc871032c76e5f7043714f89e542fe4` |
| 13 | C06-L01 | `courses/bond-and-end-of-lease-cleaning/C06-L01.json` | `c79f1dc277046644609c629b716daff3b5798c7c2af7a539b96659d921b0c0f3` | `232f99a5342afc3836dbfe76cfb748aed3fa95971db0bb150aa4d158e04d8b51` |
| 14 | C06-L02 | `courses/bond-and-end-of-lease-cleaning/C06-L02.json` | `9a0b0f6031732b4a1ae2106e84231ada5326854477b08f5071899b8552c7f090` | `c67a0484516904c393babf676e730963b19b6d7f8ae00084d941462432fbbe76` |
| 15 | C06-L03 | `courses/bond-and-end-of-lease-cleaning/C06-L03.json` | `f66a951c46605db64da3e96da1bdef45d6085e9251656346308a8b5a945aebed` | `9062f3e9233afb517b57f240a1f5412dd23ccecf0107eb34727abc260591c7e7` |
| 16 | C07-L01 | `courses/short-stay-turnover/C07-L01.json` | `177169dc1b542e6f6be035b9cb7397bcad54cb39a45d99b23b28635454946853` | `9c47347863dbe5555c2ee2f750346c0dc6fff6b2be90f6d27e41f589119be5b2` |
| 17 | C07-L02 | `courses/short-stay-turnover/C07-L02.json` | `3bc070800bc6d1d29e3ce7b060e8aff86c4f1f23291c7011dcec9e5fbdcf4814` | `d19ebf050929e9036ade02e0ed4a8ab9d10ebb467aedd280dfe4d6d1a93458cc` |
| 18 | C07-L03 | `courses/short-stay-turnover/C07-L03.json` | `5fff88010ddc01f2fc706abd39b2b0c901cddb32f352d517202848968c35d97a` | `23812c30a3f797d0d6583e7f08fe369dec938632e670a095ebe867535cbfa8da` |
| 19 | C08-L01 | `courses/commercial-and-office-cleaning/C08-L01.json` | `9d8150b58c6b2360f1c9257b7d8e7775ccc63470ec57d4d31d5caeecc9e5edb2` | `1990de4ffb10a11242ee65ef1733184466286f3e90447709ebdaf342ec948c95` |
| 20 | C08-L02 | `courses/commercial-and-office-cleaning/C08-L02.json` | `854bcf3966cf1652b16fafcacc18fb7698d162b6b31cf0dabd24083b5145370c` | `722d0cb7d976557a2620f6fc802274a2ba2b94b46fa8510397caa44e696b13ed` |
| 21 | C08-L03 | `courses/commercial-and-office-cleaning/C08-L03.json` | `2ecb1fd0cd190d4f854a487481d8915de17236b8b2118c5cfc8d3da95173193a` | `35e2a1b2604385b49176ebd79083f4b0f63e7183e37bf5721bed3c9ff3af781d` |
| 22 | C09-L01 | `shared/quality/C09-L01.json` | `ba4d1df23adceddba1261c8972953f625cb01ba33c11c39be150f4d58daa514a` | `a6d44e4511887938bf0d6afbc235eb743dc05ec0c79aed02a38663dc3b08fa8e` |
| 23 | C09-L02 | `shared/quality/C09-L02.json` | `c69a2269c10ec7a7a519d5b58900b027908b957f90a519be6c1459d4169b6bfb` | `a481c74c357c4fce954fcc0846a40a9bedaf0af32a573c66af3527e0acea009a` |
| 24 | C09-L03 | `shared/quality/C09-L03.json` | `c07935c4e562e99f517ff2fa5bd6fa6d6dc19da729419ec1ec5f927cf7434e95` | `2da23b3a96d77ea26630ea286d232d322ba9ab9d6e29b4fa522f1bd6ea456715` |
| 25 | C10-L01 | `shared/safety/C10-L01.json` | `5e5fef6fd0e29533289610bed38cefebb41d8acb7f9f36ddfff8d34599fc6934` | `010e14ea561b3fa3de7e84638b698e9c4661f120f1228b3016371b8126c11bfa` |
| 26 | C10-L02 | `shared/safety/C10-L02.json` | `d19fe29bfafeac5d370ffd134c0e082bb1168159aad0dd2408a1de911dab3853` | `2a1dc10405a8f0099cdc97c6e5d617c6a14980cde44ce12cbc0fffb514401cb7` |
| 27 | C10-L03 | `shared/safety/C10-L03.json` | `252b1db1c7358802ef5063c88925bfe1a34cb205acdd1d6514d97e06e8df3446` | `12d1e4e781dcc475a7f616af91818ed08119d57eed16dd61bd6343b1a53e6f4c` |
| 28 | F01-L01 | `shared/induction/F01-L01.json` | `ae0a9ea04b90197ddfd79eaf9331e410737376fce2c57db01dda090612a91e3b` | `9916f00dc6fed4f254ef8cb66a7f67b4a4550a86df8725d89fdc733905823f35` |
| 29 | F01-L02 | `shared/customer/F01-L02.json` | `df36901cf0a719e96d209982bcc55d563819c783f8c044b7077531bf2fe75ee7` | `226437caffd0b3fda044c56c6a5a9ec442aaf3c5ed936b438c870ce9d2e5dd36` |
| 30 | F01-L03 | `shared/induction/F01-L03.json` | `5b0602b19b9201488e3e84a3e0375022fc013434a368c08b1e46a15389839771` | `7d4a279eaf52e74ed35a8c02e2948bcbdf3bfd1d234c1c7f2c17c365c4791297` |
| 31 | F01-L04 | `shared/job-management/F01-L04.json` | `348dfe700c974db4b6340a5966335206199539f954262bd6284857d3d0723492` | `d6dd1f683ae56875452a1ab6b6885d5c68b70e837bfcf89dbf9014fe97fd0c68` |
| 32 | F02-L01 | `shared/safety/F02-L01.json` | `86518acb0f5714196b51dec105f13ab07bf7e023162ae35a8feff151674bd88e` | `be8918ab6e6156dd7d0568c2fce1e214a3ecd12dc0a6661601ac21807178275a` |
| 33 | F02-L02 | `shared/safety/F02-L02.json` | `a314fea7c5ead70a054dad24579255528d9b8406e1bea68427004912679370ac` | `7a309f7835553de8be9fc4071f90f8dbe268e5af2629d55d2493c83a84723d10` |
| 34 | F02-L03 | `shared/safety/F02-L03.json` | `be82443fe12ecd1c770d446d77195c1c5bf505549547dc8c507ba26ad288a081` | `b3c699401c79e9ddd42209363b600ff54da442b6127c8eeb6ed8c31a94338f94` |
| 35 | F02-L04 | `shared/safety/F02-L04.json` | `14defc3742e70d879e0e258bf21695bc0f87757db4afa6fc3a7f366f19150e17` | `b01d586cf6cf7bc617b24dea9e806b5f14a6d309f6fdb281135ff8f58e758b29` |
| 36 | F03-L01 | `shared/chemicals/F03-L01.json` | `40b0d8895ba5f0a838bd4aeb1cda58a278e7148a1b7b827db21493591094bcd6` | `d488e8b442a9b74d9990c29fd6f408ec4f9954c3df4873207b6e5714cf7ff871` |
| 37 | F03-L02 | `shared/chemicals/F03-L02.json` | `47a18d9d23e1214fca9dc1eef1da4df1bfd3e315a4331bbe95eb02044e452612` | `4d4bce2ac8211fe4d1f6315fc6872ca00551885d07a07cda343c746272446bd6` |
| 38 | F03-L03 | `shared/chemicals/F03-L03.json` | `eba6a2bef308dd67538483566c9611218684e1b4c149a1f3452ec3b683dd9071` | `0a5bfb4483dc0489d706db4ff2fcdf56bb4277e87e8c91f1a51aba4dc5e76681` |
| 39 | F03-L04 | `shared/chemicals/F03-L04.json` | `b773a13e3c5b873e3ecbd89451be0609687566a1b5427abf01704a4bd8ae1a8f` | `f2f9576da51918801fcc029a346470fd375032dc4c8dfe721ff1b71f28c0626f` |
| 40 | F04-L01 | `shared/equipment/F04-L01.json` | `036d4b5e54cf026024d335c7865d8d4edbc4eb9a0c6e89e033a50f05acc90cf7` | `9b68e9ffd639627487f683398d7d7c77116d58d2e18fd5c87f43a8857d7ac7a2` |
| 41 | F04-L02 | `shared/equipment/F04-L02.json` | `270f1bb00eadae60cf2a849da1ccccaef1ce9b8b96d9bdf1ddc040a401e17491` | `90d70caf687e86c2bf6c5ea541a0c7880f7908f02d9d234d09c9b9aa3cdd7672` |
| 42 | F04-L03 | `shared/equipment/F04-L03.json` | `0c5337d3fad7bd7fe0a0d04fe3fbf4d07753a8e1166d2ba9553d7d97861429fa` | `120846eda84919d3db86d81085650ba731de8dc0d9500a3698219bef05630570` |
| 43 | F04-L04 | `shared/equipment/F04-L04.json` | `03fd5ccd5bf9887a04a674a11ec85ec28c8e8b5f9d84f272b7d2d7d842dba7fe` | `43c04b4ee53b6572c6a8c437a0fefec524ac78ae1fa6437b9427c942ef546dd9` |
| 44 | F05-L01 | `shared/job-management/F05-L01.json` | `0c02cef296bb6898150ff084486e727a51cfbbd69862aa0558aa9064d1861936` | `7c2cdd40f32e00a207c4615eddb6fc07dc529e4c8e90b051fb8354c5b9ea8fb2` |
| 45 | F05-L02 | `shared/chemicals/F05-L02.json` | `b2675844586860f3b737bba7a7ff98b8894c964621c5d764880dd99ca9b0ef5f` | `5bedcc61ea52a9a3285fe8bc8b5a2ad51dbee43c340a77af12f0b4b0513f6f1a` |
| 46 | F05-L03 | `shared/job-management/F05-L03.json` | `3d714a0f3a2da212610a0364816436e19f9e31d65dc61b21ea3123340a3c8e0f` | `f6d8d0ffdecf6d6116536384252916af937800e7a831e983ea20a172d4ab3405` |
| 47 | F06-L01 | `shared/cleaning/F06-L01.json` | `2144ab7b3d1d52e9b647c7632b1a88907fa4e697aa867ef00d27cf39e56ab90a` | `c11682cb011ab70a7435aabf25e308043ae46295747a9ad5535df6809a9cb2c1` |
| 48 | F06-L02 | `shared/cleaning/F06-L02.json` | `d63ff496d0e5fbb1e9370a157441699e716b001658525715eb18990b80c476cc` | `950d93b3301b65c4d8cb83a16bf0db353508d1ab2cccc041fdff283b3246ac7a` |
| 49 | F06-L03 | `shared/cleaning/F06-L03.json` | `b607068a349fe1c348409c0f5bbd20a9b1a7372758e6ee9e7d204199fbc47e73` | `6ee484d44fa4cb720c78eff33af30564fc56e8f96e17b4cb74b261266953c8e1` |
| 50 | F06-L04 | `shared/cleaning/F06-L04.json` | `f6c7e3224c740c4b5445625bd534a7299f19d7d53b748ca39baf1ca517638548` | `56f67fe981b782b05e066299870df8c15a2b5510b32981aa58067c5ad9f6b674` |
| 51 | F06-L05 | `shared/cleaning/F06-L05.json` | `2f090a5c745ef436ee81764e2fa9ab65a765f7fe10702d45bae4b90e6f035cfe` | `d6d8425650372e3e0816b0d10694911c799754bcc12b74ad6ab06717d0762938` |
| 52 | F07-L01 | `shared/cleaning/F07-L01.json` | `00d12cd99367e70a9e509a2cdee31e85fce160d9b818ae50efa46b5663c53e11` | `69afe1886cfcddae096fe58f66eb2b2257e62baecc303f3a5b4755f859a4bba4` |
| 53 | F07-L03 | `shared/cleaning/F07-L03.json` | `51f8f27baa3e12fb33a7c78c2a25b1bdbbbab07e21ebc2986381a15b7e4c70ba` | `12fa9fc761f5a823dfef5a66333202f48df82589ab94c1c1da1290625d6f6c44` |
| 54 | F07-L05 | `shared/cleaning/F07-L05.json` | `72ce2a18192456160b0d30e9c76071ba48bc1430dbde238c029fbfa5d512d48e` | `3f6f198f107f2edfe9b5e0820edc60d59b4225888ab54aa2a445135673f578e2` |
| 55 | F08-L01 | `shared/safety/F08-L01.json` | `42e533afe1a73f340954a7ebe1a94f2fb3fc562496ad3ea2564b47a242316bb7` | `63448773e19ec08a06ff3fc465c3708823f6980408e761e6e05229fab2fe8fef` |
| 56 | F08-L02 | `shared/safety/F08-L02.json` | `7e185e4a0d8f52489007a9827068341c926ee4ac9360ec02314987931f86e81f` | `1b5014d73efbc9339d75c51831ca26b49287c9ae4c1662381b73b436afb7962f` |
| 57 | F08-L03 | `shared/chemicals/F08-L03.json` | `678a8282bb33ae2efc66c16c74ce9f7d877b315945e4993cc2b0c14dd6513a08` | `2706234007d1c76f658d7a7fd9860c007b6d94499653538c054c40ad7f75a138` |
| 58 | F08-L04 | `shared/equipment/F08-L04.json` | `cc9731cd727f38ed054f4135117fcbc546f2e038d26e5e931670d79271f4c63b` | `dbe959b41ae104e477ae5f0cd16e147f00323ca6a835895a0a4363cd9d08fd24` |
| 59 | F08-L05 | `shared/safety/F08-L05.json` | `78aa2f84db90d98dfe3290ffb7dd68c079e470ccf9f9ec2cb4c1b2e69d5a6d51` | `d0b06ea3522e530c2513d595499e67dd92cfd07037c606b1b4f78bcd45543d77` |
| 60 | F09-L01 | `shared/quality/F09-L01.json` | `11c4aa826a8043185207dfcc1cb2d83f744de808a16fc9b55c379542a0d27a18` | `28166df7e31a8a2d29b6313ca6412e16abd973adf90cd7989a67f8190f1b84fc` |
| 61 | F09-L02 | `shared/quality/F09-L02.json` | `438326aed4dbe2e04bb249e1374422e09ab5642ee46f2afe40f92ef7d96ab8d3` | `07637accf276eb115adaddbbe5f7e3a527611dc0f82e061c35065a218b90d3f6` |
| 62 | F09-L03 | `shared/quality/F09-L03.json` | `f7438ab02a297734e56bcf4e934386bc44c0fccd95f4d2f7c305f84872cdadf1` | `62382bc313a832f2a7e85a54ea38b9d0ff87dacefc98877a4c398a8cc059e7d0` |
| 63 | F09-L04 | `shared/quality/F09-L04.json` | `dc7fcd1822357c185079fbd47b1e65721c2419229af6d575a0ae6d3d0854acef` | `eaa656f631781b4e84acee5dbf4560cbe167f468d746bb3b8646fa20d65addcc` |
| 64 | F09-L05 | `shared/quality/F09-L05.json` | `acb6b9b7ce104b2c5cabe691335320403f3e27266132f243c796fbe8df4cb576` | `10c79198f4f199cd4ac0b35aee9dc2e2b34edb7644f834ae2a69f178a2b64efe` |
| 65 | F10-L01 | `shared/induction/F10-L01.json` | `81ec2c05a76703639005e592b58fb84deea23624edcf614be562ec052a3a7b78` | `a8dce3fe7b1d7a9f619d82e4c09bb515f393e1b1abe72f6a8761e5e5dcb51458` |
| 66 | F10-L02 | `shared/operations/F10-L02.json` | `a2917c8e6f4d7b9bbea296e6cb275ca22d274a35e0e11642b5110ed49a76c39d` | `80042aa370d8c8724a536a0a57d828c782fc2ff54435e79141074a7ed0af8dfe` |
| 67 | F10-L03 | `shared/cleaning/F10-L03.json` | `c3518e12bb666cb9683c66431c722d3720388d62804f4e7f5c751fb9726738f6` | `49a0e640c5d18747808e22b515016dfb0a1712b8da7d64bf8925a827641460c1` |
| 68 | F10-L04 | `shared/equipment/F10-L04.json` | `e5fe8383140411b408d32125042b1d4b7e141e4a4e20f3d2c14d3caac5861bf4` | `c75e1de06f8d716a628fd4cd436c0864069cecb2ff3db2e84f14b6abedfa43d4` |
| 69 | F10-L05 | `shared/quality/F10-L05.json` | `e9f912b9133be83ca04943dc1dceddb3464f97809d0a177845723fec244a2ed0` | `ebdb0f85c7c25fa92754bf4eaef61a1ab1e387797e0fa1c10e1ba5e57294105c` |
| 70 | F14-L01 | `shared/customer/F14-L01.json` | `5e1e22981ed747de6272174914f9ad09b0e0c39506515bfde06ab93bb5bc2baf` | `b742880d1487e34c691128b90426957df45e39845d83b5c9ccdcbd32de627dbf` |
| 71 | F14-L02 | `shared/safety/F14-L02.json` | `99036fe5e07a0b2315725e6314c6318456637d528655e2d97062e1508dbf8416` | `bb3689d020ce5c84bd32f2c17e30612b16170a5a99f23abf7b16e1e0349393cf` |
| 72 | F14-L04 | `shared/safety/F14-L04.json` | `64c569239ba28058324eb890d23c4bbe89e328256d5847b0aacfa3b0f7c87ed8` | `a6c6512324bb8136ec6876b22dca4661a02b41e99199d34ef83aa23a9fbbc3c4` |
| 73 | F14-L05 | `shared/customer/F14-L05.json` | `e3a6bad187088635905343546cb4759b914b8dba9caba89f500cbc2912da9c8b` | `64353efc178617a3f079c2a8de1e26169cbe2ae48c45f99fa36325a74115e2d6` |
| 74 | F15-L01 | `shared/induction/F15-L01.json` | `43573c5e359a779d9de8d2ef61db6cf952815af0a69938db1c3366426778de2f` | `efef579e8ae70c9e9c30dcd04acd0b9953d001db230130138ca419af9237ca14` |
| 75 | F15-L02 | `shared/induction/F15-L02.json` | `0b33f49fa56689b0408c6e97740f3372cc4727565183777cbdf94b7bc1b36b09` | `7427a07be30ca81fd6b844a6201da4f3513d9ec9237107ce5327c6c516e39f38` |
| 76 | F15-L03 | `shared/safety/F15-L03.json` | `3d0673dafe8a958683531039606e1346ab5d354894f091ba675a2a6cda8f5fb8` | `f035e5f4e658e7dd39443fa41aea5dff9bd78eb3f674719d25fa25286e0cb734` |
| 77 | F15-L04 | `shared/induction/F15-L04.json` | `65f105e3cc3cfc2ad061b66caac3a96a6dd5527291588941cce3674d8eef2a6a` | `60deeccbe790289002de4318ff7b102d6c254ff9e5c4e19479755f287a8fe325` |
| 78 | F15-L05 | `shared/customer/F15-L05.json` | `9c11e31c73be2f8a56136adce90f7076d2828d67e14bb63709c6f012f39e9441` | `7e1204a5741346dd1d6f9fe77c10e9f804f286bf19c28a58daf90d319df8dc90` |
| 79 | F15-L06 | `shared/safety/F15-L06.json` | `512d14df357756f122ca2d242e99d36f53119f96a36ca142dab27e1d05aaf142` | `2e11472332690dd9d2d0a5ce50ff8bfff6676e64959f75e14ba4422c66cec847` |
| 80 | F16-L01 | `shared/chemicals/F16-L01.json` | `c0471799e994a7b2141051e6a4a55e48d7b3c7a6b254570b5f68e2abfd2b4d25` | `054d1d166e915290d8bbf91aebe1c50933db1592dab2b4814fbc2bf8d3a7c120` |
| 81 | F16-L03 | `shared/chemicals/F16-L03.json` | `0ebf561f8347f40b286ed69ac4333da821ea2f8dce83bcb87b7a8d6d5d9e2fa0` | `f1f6e50f839bb18d6577d83503904eb665cb682e9fd8f2da8bb1311cfdc56415` |
| 82 | F17-L01 | `shared/equipment/F17-L01.json` | `c088d0e09c9c75de7d784a1db3ceeb8683ca24280a7a9c70f43dc89278459725` | `a17e9b13ae802c2f0b6f4ca97990250f9191a1d11ddf57160c742ae2b4844a60` |
| 83 | F17-L02 | `shared/cleaning/F17-L02.json` | `ffc2d4126f78ba4dc1a76cb46b31adc9323a6c549bd23e14b2930d4693f7e081` | `ea63aa6d885038b01429fb8ab35ed32ea66631e5f4e2cf1d7771a194ed9ad1a5` |
| 84 | F17-L04 | `shared/safety/F17-L04.json` | `956dd42071d26407c6c2d02f81a9f1c23b8ced514428a3608a36ffe07319563d` | `9771cddca051a00f1044e8d83f15402c264ade8e8bf5541cdda87c783709ffbc` |
| 85 | F17-L05 | `shared/safety/F17-L05.json` | `ea58685f768a648c305cc2952f7689fe89e31a2c5fb5538114bed184e18cdae6` | `3f52a26cdb7f59334f9502af2d42af23e2754727886a711bd160fa009af29468` |
| 86 | F19-L01 | `shared/job-management/F19-L01.json` | `497ad23dbd45257e535ff88972b42b33ff78bf6abc93890d7afe3142491b5df9` | `625b20c1a87ffd9abb7ab4eca100a6fcf8bd80d1f73e651c356f81e13c0904f0` |
| 87 | F19-L05 | `shared/job-management/F19-L05.json` | `f2e6e659376f4b7fd6138b7f7b9a4fef74790b055e5e7d56924c3d038896d632` | `aaf565d3d12efca71aca71652c001139dedf46dff875bc3ff39375e01270ee5e` |
| 88 | F19-L06 | `shared/quality/F19-L06.json` | `49fa5168a725ea7df654b3f9ee02a7e54ec3371e3cca94658a07a7ae5b45e8cd` | `0154fdbd555ab6951b8c26cf43d1345430cc6671a57bd3550be50ba26b3fbef7` |
| 89 | S12-L03 | `shared/quality/S12-L03.json` | `d2707ac51b3f720a409f3cb8ff6c71f2990249886b5ac27caaecddb2899121eb` | `628183bf4fd45ebb288577b817a65ff7b308966eb583e94324e358692d86e53e` |
| 90 | S12-L08 | `shared/quality/S12-L08.json` | `c1b69efc8954431fe49728d395962f3531cc0a4dae68f7d71cacab8c83f1e2d3` | `8b379bb9acae3081db3f2a66553b0e87103ef7206f07039984289647ed96f904` |
| 91 | S14-L03 | `shared/safety/S14-L03.json` | `bb9e7da06cefc7217603625b35d3b6ec459549ff974b5b8569dcdb3291ec8c01` | `73c9fd545506aff2784d928aadf1a16d51f73e4dde8706e81adfdd1f8e20c8ee` |
| 92 | S14-L04 | `shared/safety/S14-L04.json` | `87aea1fc4843df04e62c9977d886f6f49cc4a61f3af2302bab7d58bce10d3342` | `5b5f06fd7982f10b12c463f8fce09dd8b8c2d247994dbfc595ccd9b634c17c97` |
| 93 | S14-L05 | `shared/safety/S14-L05.json` | `836deb428f8ab8d0e8b16df37b6767a077a788c37d8f05d537a0bf67f8a76cd5` | `35e815d5f8f0e590e28d496e04b977c90548dcc6ebafcbc78c6abcb39262052b` |
| 94 | S14-L07 | `shared/safety/S14-L07.json` | `6069b1c89d5d017b7cba89d3a7e761670086e33c667be04c09b81645e59b11b2` | `144b9a0ee5041524f71ab7aba4ceb622c582ef51dbad002a33a8f42dd3b961fc` |
| 95 | S14-L08 | `shared/safety/S14-L08.json` | `dc1a6596063ae4582ce9c4ae1cd714c7597fe1521809c3a49865d4bd0503b469` | `6bcb7d7c4bcbce21b015d72ba848db01001707ec3705b596a035a7342e5a3f3e` |
| 96 | additional-specialist-services-L04 | `shared/starting-business/additional-specialist-services-L04.json` | `c544d1b0816f34af345dbf991883c1e6761213500fd9c70ad17efaf56801a429` | `c8a83ee600bbc7ae1f1669702871ab960b9b139bf308c63d8d7fc64e3e0f8d93` |
| 97 | aged-care-infection-control-L02 | `courses/healthcare-cleaning/aged-care-infection-control-L02.json` | `b92469c52afe0e2027ea0ad0ca690deecb338321eee1bc454953b5b26628aeaa` | `d5fd271f93c024a0cdd3aeafaab45edf77230496b57f644bfcab0357fa52de3d` |
| 98 | aged-care-infection-control-L03 | `courses/healthcare-cleaning/aged-care-infection-control-L03.json` | `dea5b2da65ec8db95dd28f61633ee37747de5166b440ae14ebdf5c880ea893b5` | `1b1bc27e5f5aa2840f2ba5c92bbe93fe9780ad1d79220f6f061a9e7cbdff16b9` |
| 99 | aged-care-infection-control-L04 | `courses/healthcare-cleaning/aged-care-infection-control-L04.json` | `2478ec0e256a70e674be9b21c672ee5ffe9a7678e2797075313831c3db787765` | `c46bab3db25055bb09c7debb4818596c66d9d87f3755fa470de7201a25f2cf33` |
| 100 | aged-care-infection-control-L05 | `courses/healthcare-cleaning/aged-care-infection-control-L05.json` | `893deb6e21832464206ccb0b57f1f5905568418b6706423b604e2f89a496a3a0` | `65f226cb2735883711d4fa44b0446b296e9d0b29c3b6f059840e9ffb01c697da` |
| 101 | aged-care-infection-control-L06 | `courses/healthcare-cleaning/aged-care-infection-control-L06.json` | `459b8c010efc7423b0200903088b7d741d0911cc0ef1a5e5fe67123399248db1` | `925be712a5702bea34a3197e656214655bfb6c62efba7be4bff866902e89e005` |
| 102 | aged-care-infection-control-L07 | `courses/healthcare-cleaning/aged-care-infection-control-L07.json` | `041646bc57b127eec5d114da231c90d8086d743c8b122b4ed985ac18bfa5d2f8` | `abfd4ffb2b4f9818620d63ec8b64ffb644688ffe847afcde2476e40db69ae26d` |
| 103 | aged-care-infection-control-L08 | `courses/healthcare-cleaning/aged-care-infection-control-L08.json` | `9a5664522e1ec38ebf8a7d1c131e9f62dbf4be41ac1f4fc6e67a49dd2b20dcad` | `85ef8cb31f841ecef1b7892efe8c6d6cf28e72b1637d58bca68cd2e3a9a2df1a` |
| 104 | aged-care-infection-control-L09 | `courses/healthcare-cleaning/aged-care-infection-control-L09.json` | `6f0835ea6c1322a072cf7b6174b33694bd44c3d8ab5a66c456a51379a864cd0a` | `e3a68c64a29f42dd05e40b2fec7d047edd8347b00e91a54fa395aa32f75ef4a7` |
| 105 | aged-care-infection-control-L10 | `courses/healthcare-cleaning/aged-care-infection-control-L10.json` | `c629eba3539f6f055815b8672db1b066f11fde37f774308c8b2395fd0e779591` | `7f2750f740adfd90f0391e2737d6d3434945d3c0e52e93e9a4b7ab38b12eeb72` |
| 106 | aged-care-infection-control-L12 | `courses/healthcare-cleaning/aged-care-infection-control-L12.json` | `f0215bfdac880654dd353338825614a1fd044d64a87a7a5f8afa4607011006bd` | `fcafd5f3658e886383bd2bb50f803d82b206feee083116fbff3ea3657afde5fe` |
| 107 | car-detailing-L01 | `courses/car-detailing/car-detailing-L01.json` | `8e3b600ab2fc0c3d3f9ec9a88654c0df01cee1b0b5e179a1c6d0d875d2e9051d` | `52816d2d9400d0695ae9fd8385c82634cbbd9d98b02e5c2df5542569d09a4373` |
| 108 | car-detailing-L02 | `courses/car-detailing/car-detailing-L02.json` | `8cce10a5d3821b47e006a6458f680c5804e804455c515c231edff4dadc66fda4` | `933a425eb241caab31036c09cf4b6b7daa659ebba0c6cac700a69d1cd1e35956` |
| 109 | car-detailing-L03 | `courses/car-detailing/car-detailing-L03.json` | `214958a6f4dab741476275258b01f07a239944a498158216f3cc445b68a307f9` | `71884dec892cdf65831f7375e98a7cb23f1056ec4471c244cd8c07760b56a847` |
| 110 | car-detailing-L04 | `courses/car-detailing/car-detailing-L04.json` | `358d47c3e051aeafe78d5b385aef6605ba783f89c055f520d0e65029976c8ecc` | `df4e287c71bad75bcb73703d411c9dac41ab048566fdfeaee6187340b8f78974` |
| 111 | car-detailing-L06 | `courses/car-detailing/car-detailing-L06.json` | `4b9daf6313407bf86c677ba170cc9903ca76f9efac7654e17d6d74f0f32b70fa` | `31066e93312690de7ad7f03a719255d1b530986cda8bedbd1bc8c9824a166db6` |
| 112 | car-detailing-L07 | `courses/car-detailing/car-detailing-L07.json` | `2339f4309fddb542be3c0f86da3bdd00e05fdf4b2fb85924e65abf782686f4af` | `a28430789b61d0a77cffcef0ece7d80899e4326deb81f9351136a73d6ad34c24` |
| 113 | car-detailing-L08 | `courses/car-detailing/car-detailing-L08.json` | `16ed0d6ae04600c9f060370bf513f614b789780b75c3d17c233f6f624edacf2c` | `761ef201c86da5427c14f52cfc39d7ccbbe42faf24952c21e5250e966c79e3d0` |
| 114 | car-detailing-L09 | `courses/car-detailing/car-detailing-L09.json` | `7cc898dfe66245ea53df1742206552f511fc5f518a05c6e2db203515bbce026e` | `fc5ffe705bc2740cc56950052e4f9cbc987531ca4ff6c14df4ea66d70b06345f` |
| 115 | car-detailing-L12 | `courses/car-detailing/car-detailing-L12.json` | `58341262c85e22f36c36e98194fec90119f7adec341331cb0da00162941a48c4` | `9aef5163783d1c661693737263521840e21351a50bedaf9962726f1d1023efe9` |
| 116 | construction-site-cleaning-L01 | `shared/cleaning/construction-site-cleaning-L01.json` | `ba28648a813ebda2919767fd75b11a47fad28968658e26976f87b6472be1342a` | `a9d750572f1e1dc53923e333b44ba3bb03562bffbae011f5ef1462366c20d856` |
| 117 | construction-site-cleaning-L02 | `shared/cleaning/construction-site-cleaning-L02.json` | `1c75541ae5fde4e4c49e04313f3d91b5b2287dcd6ac0aa6c62b4f8fb9524f373` | `e98f145fda812d000b740a2f38b2234edbe48bbd41f7c049fcfac95d1b8310ed` |
| 118 | construction-site-cleaning-L03 | `shared/cleaning/construction-site-cleaning-L03.json` | `f2f7fbe29c204b05cadf00e6d1174e59122268b9ad0a326d7d7e5c7baeaf17c6` | `3384c01a171e21c03672f4ecc599f8cfa6fb7c6cddbe20d92b28d67b1e95cd88` |
| 119 | construction-site-cleaning-L05 | `shared/cleaning/construction-site-cleaning-L05.json` | `b577cbb3e012731c6c43e5d818f7a1a23ca538c642dc1e188e81c19ff7571cfc` | `a842656913a692275ad04bef07641d07a1d4d228f4fdc506da5799ea0e6336c5` |
| 120 | construction-site-cleaning-L07 | `shared/cleaning/construction-site-cleaning-L07.json` | `6e4f41d714fdaab08a91b00ce41abd94d6d8de021f686acba792105e778e7b56` | `0bd819d61c7db203c381247ad5dbc4d23bcbb3459c43c8291ecc2e5159df8e37` |
| 121 | construction-site-cleaning-L08 | `shared/cleaning/construction-site-cleaning-L08.json` | `af54f92b3855142e7e57d56f88d1454aaa11275de890fecf9d6951cd38d099cd` | `be8f22ff66b47a111d952579d867ed108174ccacf0e1f4b48a0f69c83eb1e741` |
| 122 | construction-site-cleaning-L10 | `shared/cleaning/construction-site-cleaning-L10.json` | `42ef10ab28d5b753a51ce047e87e6118c6472e37e0d61a96833e28b8daf3e7d6` | `68fe30e6bbe5f7eb039911f7e13314ef54a7ed2edb16b01519fe3d0c9bdae9a5` |
| 123 | construction-site-cleaning-L11 | `shared/cleaning/construction-site-cleaning-L11.json` | `03898c88c4e7d68dc6f84fd7fab111fccae942aadb32ce39439f623d9307c2d6` | `dcecf0e15172fca9b1f39ee7021e4d5a7f8f5a2bfdacdace7e0375fb97e03d65` |
| 124 | food-processing-sanitation-L01 | `courses/commercial-and-office-cleaning/food-processing-sanitation-L01.json` | `1e482adb600b03d6b92b17306d01a3ccf1a18ad25faf62771c58686213908cee` | `26d23c802d30199a9d47d3071123a451282484b3d1d5fe743034170156479d61` |
| 125 | food-processing-sanitation-L08 | `courses/commercial-and-office-cleaning/food-processing-sanitation-L08.json` | `e7e284c23889f32f23abcfb30703974b7193e914f50ad82d058648c8f7e60833` | `c6cc51cd799c04fd3ea6b6a6b8daf5ec83e7f774e7c4007efc512fd437819f18` |
| 126 | food-processing-sanitation-L09 | `courses/commercial-and-office-cleaning/food-processing-sanitation-L09.json` | `01ec3ddd5dba3e0e7df7c40b905d2b292e63e2a82fdb5ba428c719b89b39f091` | `2522d2d8b498e0813faaa61fce4737edf3889a010329cdd4001bd251e32e272f` |
| 127 | food-processing-sanitation-L10 | `courses/commercial-and-office-cleaning/food-processing-sanitation-L10.json` | `0ee3f2b3d16547450e5fa1100c0e04b00c6751ac8ec576ecfb622ecf92d7da8e` | `f09b9abe42e6f4d8da263daee11a88975aa09c217aaad4de3513b88de51b91c9` |
| 128 | food-processing-sanitation-L12 | `courses/commercial-and-office-cleaning/food-processing-sanitation-L12.json` | `5b73a04eea21e0535d985bcf7a27e6007f102580809000686c341fc346bf7f6f` | `07138b06f1c1ec360b7cabba4f8a784272b5fe94849ad72aeadeba12876f277b` |
| 129 | garden-cleanups-L01 | `courses/garden-maintenance-and-clean-ups/garden-cleanups-L01.json` | `8103807d97f9f9e422ba35a6c2999da76c50fbaaf271dcefae8454024bcb8b27` | `8488fce3178a928e09fe34cdf220fda8531d7128b7d783a387a3f60a5530e85f` |
| 130 | garden-cleanups-L02 | `courses/garden-maintenance-and-clean-ups/garden-cleanups-L02.json` | `53108001e967152352e1b014943fa4399eaebd90b580b2db12b3a204d3ec046a` | `374b8eaf4ca9fdeb60ef2b2863c6f7a1fa3b4c9c169203b0d0af5332c86b4c85` |
| 131 | garden-cleanups-L04 | `courses/garden-maintenance-and-clean-ups/garden-cleanups-L04.json` | `ecdb2ff639bcd823e98287433003e5ed409f776856fd53f32d747c03fb30fffb` | `c18cd4767993c09e75a459f57db1da66b793fb2746fc147352574e7d2c35aa16` |
| 132 | garden-cleanups-L07 | `shared/outdoor-garden/garden-cleanups-L07.json` | `a6e5ff115d423a9b0b1d070f647acf81b9a07669b44c39cd2d6608a8b5ca2733` | `6759a028de0a5dd11b33b4e8420d74def0d9999eb3eb88951d7394e282305b5a` |
| 133 | garden-cleanups-L08 | `courses/garden-maintenance-and-clean-ups/garden-cleanups-L08.json` | `a43cdb5e3fd61940800afc619413ea45c5b97fe93712bbdf1065efa423e1756a` | `4a5210d63b0007d962a135021d26dded265eb30fdb37e87d3d183b1bc63e0810` |
| 134 | garden-cleanups-L09 | `shared/outdoor-garden/garden-cleanups-L09.json` | `279893568e19e2cb591d5488a48e1f656866b8db2c1dbbb888280760bdb23239` | `22db4a53b85711838ee84698080ce8f491e7556201aa7b1f8499a6c3449449be` |
| 135 | garden-cleanups-L10 | `shared/outdoor-garden/garden-cleanups-L10.json` | `9ec50a437a10b7bbeaa8f324d505cdc90e4989d9add00acc5af8b9457d3cb126` | `3aecef1a54c5a51480dddaeb148e101074a2e5b607a45efd0bc327a34fdc95ad` |
| 136 | garden-cleanups-L11 | `courses/garden-maintenance-and-clean-ups/garden-cleanups-L11.json` | `7672e2f8431e8a092c9f8f0749ca157918c0e272766710bcee642ae2a8a4ac45` | `8ad6fae7e20be45f9eac2bb0685781064a6b4f82efdf8f86060f5ccf431327a3` |
| 137 | garden-cleanups-L12 | `courses/garden-maintenance-and-clean-ups/garden-cleanups-L12.json` | `96afa7ad02077b67ff302926d22a5825e3fc5c3a1034c207e156c739e20dbd7d` | `53e5d31803461e6a904eeb9d0e43ae87e1bca4b701478975bc44a50c46b8c5da` |
| 138 | handyman-work-L02 | `courses/handyman/handyman-work-L02.json` | `475319a09df7843020a43e1aa5c56074305c35821f0d8283e52b47d902f8f3c6` | `bd451d132112ac89069520e272226cc1693956854066b9c98b601263c336a328` |
| 139 | handyman-work-L03 | `courses/handyman/handyman-work-L03.json` | `ccf6b75ff75a985f56dda73c7c7cd31b20e2c69bbeea2af92d09ec6103683d35` | `542a3ebb3baef21c82bbf2e9264f73ce07ab394e27dbf4eff8d6ac3f14ae4b46` |
| 140 | handyman-work-L04 | `courses/handyman/handyman-work-L04.json` | `96fc41f4255a8df5ba74e8291384d3660a731124c5f5c704be735908dba6a1b3` | `5bdf646899ec6d8c59ff058a503683168c6abca743c50ae84ffad10c9357eb6b` |
| 141 | handyman-work-L05 | `courses/handyman/handyman-work-L05.json` | `f37bec41a3a4d2e710f07074efb7c870c318b1d7761e42eb42bdcb97c32dcddb` | `1bfccc8e92cf616c86de050046e4f2a60bc2e5d2d6c148498b0e04f2b8a5661a` |
| 142 | handyman-work-L11 | `courses/handyman/handyman-work-L11.json` | `c215014963464983d0b1622fce930f848fac7cfa83d08bc3672641ef25020f84` | `d0aad992ec0b1ede0a2d1c2d7387428bb6af0191ac0bcc3c5bbaac21bc202999` |
| 143 | handyman-work-L12 | `courses/handyman/handyman-work-L12.json` | `293e024edc13077bb019c8aac431a74953e9bb19c3ae166d5addbe63a776ab9f` | `dee2ecbf5158c89f093b614e2770274ad48fae1dc8a128377854edd8ecb98780` |
| 144 | high-access-window-cleaning-L02 | `shared/exterior/high-access-window-cleaning-L02.json` | `58bfaf582713ddfb5c0fe1204d5ac434c5205c582e3eac7f63801355d1dbd98f` | `38dc6eacf14b188012cac44202612a488243e6b71ac6b02081f7c1f5db7b09e5` |
| 145 | high-access-window-cleaning-L03 | `courses/window-cleaning-all-heights/high-access-window-cleaning-L03.json` | `d693193e3f5ac7fe294e7af360afc0802e337eed1ea020fd9f5425a59965941f` | `ddf52e34d9e1ca7c914465d35c1f56a65a1aacca10b801a64032c083e0d81c14` |
| 146 | high-access-window-cleaning-L04 | `shared/exterior/high-access-window-cleaning-L04.json` | `1ff2fc32d893774b263f2f80198c438fe9dc7abd3ae76f8a69eddbb54009d6ee` | `6862ccb05bcd4600027d302b6a91bc43e85e0b00727257dcfdf0394110ea1b5e` |
| 147 | high-access-window-cleaning-L05 | `shared/exterior/high-access-window-cleaning-L05.json` | `30d95b597916b2809656c7bc12f80589cdf810cb04cab5c62fafd2fac6331b2c` | `f8267162886053ac1bb25fc23c3fe6f88e38695282c62334a924f38cd492b921` |
| 148 | high-access-window-cleaning-L10 | `shared/exterior/high-access-window-cleaning-L10.json` | `78afddb465555b0bf71c32a5aadda1856b5b60d909ead0311c0e05bbc6e7a858` | `ab7f86c505a4d48f25f6621ac3066aece94c44296b2b16651b9e793cd943cbe3` |
| 149 | high-access-window-cleaning-L11 | `courses/window-cleaning-all-heights/high-access-window-cleaning-L11.json` | `33cafc8c87e0d3f6a8356d8b07e268689dbb5537dd626bfa035156743ab1fd0b` | `79d99d310786dd603ddc1dc3902cea0ec5468deb682134dbb2cabce48fbbbe63` |
| 150 | high-access-window-cleaning-L12 | `courses/window-cleaning-all-heights/high-access-window-cleaning-L12.json` | `ae105fa82f6f62256d7ed8213d67ab484c0f90a6776e6079d421595c672ddb1b` | `12693e25dc9e51ac05c5a16bff93ec8203fb97d0f67bf0e447bedda596230015` |
| 151 | industrial-degreasing-L02 | `courses/commercial-and-office-cleaning/industrial-degreasing-L02.json` | `c4134b8457593d25acb7ddd869053b4413c4161ceb29cc12ac55a115d0b56102` | `82ff931edfab91ec506a451ce69a4d5de1e46bc1ad5d47bd78e3c13ad1327b44` |
| 152 | industrial-degreasing-L05 | `courses/commercial-and-office-cleaning/industrial-degreasing-L05.json` | `cd70d5c056683d2b9cceee78a77f0edf8a5511caa64a52664eddb8b2169e2427` | `7a2e510ac7360e8054227f39d0d5032909b5f2d76f0881ba10fd88fe93e66e95` |
| 153 | industrial-degreasing-L06 | `courses/commercial-and-office-cleaning/industrial-degreasing-L06.json` | `d75f8a3ab169866fbf6e483d02869cecd3663f0f12569a5f6dd4efc48e308bd6` | `03ec453fa59d3f15183a8399b263ca351f07cd74429e2d1a471bb83615794b44` |
| 154 | industrial-degreasing-L09 | `courses/commercial-and-office-cleaning/industrial-degreasing-L09.json` | `2366b8efd023097f682841d6449e7d5db1ed49753628c8d0479b25fe6fa2c8cc` | `5ec25a0053d0093f5e28e87e2a44937afe1d91a93e1048a62bcb1bd8cd749d46` |
| 155 | industrial-degreasing-L10 | `courses/commercial-and-office-cleaning/industrial-degreasing-L10.json` | `5821acb52511bed07abfc2dff6ecd4d626b27ff61341302ae8c58b2592257e92` | `28317192c5510e772c9722af42b4bb772858d1a7143ed4f62f6570ed7be0d1b8` |
| 156 | kitchen-cleaning-L02 | `shared/cleaning/kitchen-cleaning-L02.json` | `e68a3d895e4e3a6872222c44ce9151f5083fe41a92fc91c8d0c03932bd3b8f66` | `8e921e4b6ed700c95b7dd958f024b723602b4a807383a7cdcdbeeba7243ace4c` |
| 157 | kitchen-cleaning-L05 | `shared/cleaning/kitchen-cleaning-L05.json` | `496dcd40257581c6b7d7a59f77ffb86ff933e7a220f24db6f1be307716354784` | `d0324ba49f06e9955d614bd76a9b862f98ffd73241a57aca25413e188ec0144f` |
| 158 | kitchen-cleaning-L06 | `shared/cleaning/kitchen-cleaning-L06.json` | `e9c1ef1cc0bde91507529976aaaedc1068facf788e2d9465af299783cb91fdbf` | `9a968a0ab333a7477d6073f52226ef294c1091b7767e6766b026d3c6d77be108` |
| 159 | kitchen-cleaning-L07 | `shared/cleaning/kitchen-cleaning-L07.json` | `7ddc16b85b520b9d1033dc6e6c8c7f147a15943c39bbea5d48ecec85081f0517` | `4b1ea7aff3201993b56943266ae3da133338ad25890954a4f574d5d5bd4380d1` |
| 160 | kitchen-cleaning-L08 | `shared/cleaning/kitchen-cleaning-L08.json` | `8aede17e6fe09e42c09ae1d20b5ee862115c3b8a117284dd58bf04e28d763602` | `e1094255b7e75bd7a8781d6f4b70777af8060a1a47b7f9c0776981a250c2195b` |
| 161 | kitchen-cleaning-L09 | `shared/cleaning/kitchen-cleaning-L09.json` | `7d43d05b9448f6d6752c6e526aa94ce906919a6aa41f1ed505282941c463f1d2` | `c8482409fef4d59d1c7a13e34bd2623a7a34ffa5d869ded9770b478eae3ebc5e` |
| 162 | kitchen-cleaning-L10 | `shared/cleaning/kitchen-cleaning-L10.json` | `3edd709c2a74635931e0bb31a90da83cf099ff857b11d93f45570111a0144470` | `39b87edc5cb1c0fdf2a5981e8fdd20864897824b03b3c7b014845b8be3889b98` |
| 163 | kitchen-cleaning-L11 | `shared/cleaning/kitchen-cleaning-L11.json` | `8e55ee0772a5d6651193359311ef8d7f4ab62e9bda16d0e6deb8802a17331ebe` | `e11f91ed5ddc4e0f5065691a09824b57ea09a4743f3c279f49afc4f38e46bdda` |
| 164 | kitchen-exhaust-L02 | `courses/commercial-and-office-cleaning/kitchen-exhaust-L02.json` | `e7db8ac3010d474325b4968233c17e25c8d7476edfa29cb5e447d01c49ace5e5` | `4d951befecd813c546b059b4be96316f8509474e4ab29f26057e5608f57971c6` |
| 165 | kitchen-exhaust-L03 | `courses/commercial-and-office-cleaning/kitchen-exhaust-L03.json` | `f97dae1c76af764c2cb5dcb678ff91664b3e4367a168bc955ad1f4d893ddb978` | `aebfa4b927f715a5103f765208321d347cc9022c45e4b966997e6b39c7f71e65` |
| 166 | kitchen-exhaust-L05 | `courses/commercial-and-office-cleaning/kitchen-exhaust-L05.json` | `fbcb044d838ab94dd9c7be6c557da2d6e9163ceb3cb2eaefb6a83dc49c440a71` | `145a2ffde8e1347418f91f927d6afd58c9a305fac7548acb735b30553cdba3a5` |
| 167 | kitchen-exhaust-L06 | `courses/commercial-and-office-cleaning/kitchen-exhaust-L06.json` | `ce5fa3b8c1b7b2b5ef6d4a45ae20b96e8403ed80c592bfb614fb2aef18df1af3` | `63f8fb18c8fcd8082c0d4b8bed481cc9c5fab0645cc5ba75bd5ef5e4f8b5bf38` |
| 168 | kitchen-exhaust-L09 | `courses/commercial-and-office-cleaning/kitchen-exhaust-L09.json` | `2d067de3fedaabbb955a08cc8149e26ab1c2d694217a1a83fb413e8e3a1003b3` | `79dfa699165f2de5310bfb003e278d03985af7b7d687455b8329d15cea53004d` |
| 169 | kitchen-exhaust-L10 | `courses/commercial-and-office-cleaning/kitchen-exhaust-L10.json` | `7e76252cf45dfe2167271ee33db6d160e9673d9a5a47ccfc1c1b46da39372aba` | `770d9099907430bb3c092e69334aa77bc96d143ef0dc01e55e0ad4fc310f5de3` |
| 170 | kitchen-exhaust-L11 | `courses/commercial-and-office-cleaning/kitchen-exhaust-L11.json` | `2da06f4cea14e0be8541071a44abfd5af4b4b2219dad29b2c1877c3ddddd8f95` | `249039435f3be98ef5aa8ab6a7b3262e5e89cabb566e697e13fe71ba278b98ed` |
| 171 | laboratory-cleaning-L01 | `courses/commercial-and-office-cleaning/laboratory-cleaning-L01.json` | `dfc66bebf045ac20d1d853f688c61d6b1306e63d82eb1eb320d0aa1eef4201db` | `d68eaca57dc2be56672150b1b850487a93c1059ccae333021913dd4e5107da84` |
| 172 | laboratory-cleaning-L02 | `courses/commercial-and-office-cleaning/laboratory-cleaning-L02.json` | `4ab3256b29716bd28e3b92280f761849e5901d1564b77793dc933c90781cb71a` | `2c40948ba74b17485a2193f87222fe540ca862698973131689bb5b022ed4f2ff` |
| 173 | laboratory-cleaning-L06 | `courses/commercial-and-office-cleaning/laboratory-cleaning-L06.json` | `de85948c487c9d3a34429ff05c9292e930963ff4c0791c9e00397647d9f8315f` | `9b0dcd464b4c4d591cbb2971766842009f086f55653e1454a6b4ed0e8a214b9b` |
| 174 | laboratory-cleaning-L10 | `courses/commercial-and-office-cleaning/laboratory-cleaning-L10.json` | `b4b89fd3ebb4e8aa15f83b6929a957e02140ab6d271bd8fdc92f2e64edc196f4` | `5309fb6688b335abe7d7fe42bbc7919c5b943ec019a06fcacd5545db4815805e` |
| 175 | laboratory-cleaning-L12 | `courses/commercial-and-office-cleaning/laboratory-cleaning-L12.json` | `0092b3d9cba07467ceae08fb548d51fa9bc8bef157b09f1666f14eccb9099138` | `a8acfdceaee96e8320511cb00698cb3f986e86d4213e934dd6b3c63d84c0a48c` |
| 176 | medical-dental-clinic-L07 | `courses/healthcare-cleaning/medical-dental-clinic-L07.json` | `dcc2e8b5241bb641112fe3ded995f3e1ef99aa2d601349812a3697d8755d9209` | `1bbd07d2a329edaf37ef2799a3459a5f2484b9b79c20a2ac105b67e83e857aa6` |
| 177 | medical-equipment-cleaning-L02 | `courses/medical-equipment-cleaning/medical-equipment-cleaning-L02.json` | `5db1246ddfa3ecccfcb4777a5dca9e47f12c1c6a96fb7993d6ac65295d83b768` | `307b2d967274e89386230034e2cc771d43831ad2e9878a98fd11c33ec434ac56` |
| 178 | medical-equipment-cleaning-L03 | `courses/medical-equipment-cleaning/medical-equipment-cleaning-L03.json` | `614ad5bda1e98131eb570185ae4338e00762d2bc092e3887553875ffafeacf0e` | `d809621d0b383b071e5dba1e550c41adc95676959f856e4bf0740f4a9bebdf25` |
| 179 | medical-equipment-cleaning-L06 | `courses/medical-equipment-cleaning/medical-equipment-cleaning-L06.json` | `86436c2d9b42c613a772a586f937ab3f028a617e31a64855188f516465eccc3f` | `ab6572a40f484c4688873e02ef9db07975bd84789940d832cd9f089c99742461` |
| 180 | medical-equipment-cleaning-L09 | `courses/medical-equipment-cleaning/medical-equipment-cleaning-L09.json` | `aadbc455c4c3cc69ab48bb53986665ab587c7f363cd27c32baff6272c389dda4` | `02af5b07bc8223ebb57f4495176540bcba9fd6b5b956c8f58b572599c316d990` |
| 181 | medical-equipment-cleaning-L11 | `courses/medical-equipment-cleaning/medical-equipment-cleaning-L11.json` | `8f07f083a0b8c724d887755f3cedda1814ff7d2f7732c66773e9ebd6aa29c768` | `c12642650ff13d0271ec9128b036b6894a9f4a29d18c07f765480acaaeeda9ac` |
| 182 | medical-equipment-cleaning-L12 | `courses/medical-equipment-cleaning/medical-equipment-cleaning-L12.json` | `6a5d7e6dbf39649a3cf149070c1e7488dc0ec31d1b5a8c7fa4e0ba07692b9bb5` | `df4358d26dbc152389b45321c0d4b3310eae12a955214c3bd584f374cef3e7e6` |
| 183 | pool-cleaning-L01 | `courses/pool/pool-cleaning-L01.json` | `3acf919d804a82de05fe7ad52754d6e1a9bf02249fde45702ce2946779054ee3` | `bc9ce81de8cef9e8fdc1b059293c6917d51ad7a26166bd230f6525199ea14e28` |
| 184 | pool-cleaning-L08 | `courses/pool/pool-cleaning-L08.json` | `49e2b488532e54a5a6e262e9e1c25cdf3e285b3049b12d5bc7d3be08d17b8f37` | `84eb1680aec7ba3774a8e4cc12250803f0a1736bec91549be3ca75b58be95c8e` |
| 185 | pool-cleaning-L09 | `courses/pool/pool-cleaning-L09.json` | `4c182a81240182ae5e65d5b695827ece64303bf617197bd1e8c7f9328cde89d9` | `33e930d77f96c7277962c337b938f40484096b427e501346aa27da1f112b161e` |
| 186 | pool-cleaning-L12 | `courses/pool/pool-cleaning-L12.json` | `7cee63b99863c568bdee74ca2a28db9fe077876ad8f2ec9d8cc4c5cf9b7ade60` | `659ae3a19f9d790e452f35dcb62b5f62d07ed19274c1aef738f1fcc9e6bcffaf` |
| 187 | pressure-cleaning-L01 | `courses/pressure-cleaning-all-heights/pressure-cleaning-L01.json` | `5187f82a7fbea454054619056819e0d6ecabf72c7919e77f1fae080e6ad42e13` | `9a0c0f1b6624e90fe9d5e07ad5d9131ed254c1a0c0369033c9a06c8cb02e5f0b` |
| 188 | pressure-cleaning-L02 | `courses/pressure-cleaning-all-heights/pressure-cleaning-L02.json` | `9d04ec5b429503a4678f0910322f61bec1aee4a8a3526746332aa6c69d72958d` | `aab81bb54b0388c979d098f2ca20ad671eb17b26d70c5e36a5150cddd9f02f39` |
| 189 | pressure-cleaning-L03 | `courses/pressure-cleaning-all-heights/pressure-cleaning-L03.json` | `9006b6e504ec3895176bf0481d7bc81d681c44d9d342c972e703986c89bc56a7` | `798c550a5731fb94d9a5be9649b10956b6edc80a4d2293acabcb87e1b5f6eaf3` |
| 190 | pressure-cleaning-L06 | `courses/pressure-cleaning-all-heights/pressure-cleaning-L06.json` | `ec5e62ca9dd543c34697d27d9653651459e0405c06984149da7ebdcef2470f7d` | `a2eea90378c3904eb0a9e4231bff126153871f0275dd84a99739ebe7a970a56b` |
| 191 | pressure-cleaning-L10 | `courses/pressure-cleaning-all-heights/pressure-cleaning-L10.json` | `50122f312b5118f72f2811caaa731da5f8bfe2ab24822945f1f3edcc0ccfdb4b` | `07b7ed7ea1cb4f57230fb116958a5509d1835e9069757df78757104d89d3dac3` |
| 192 | pressure-cleaning-L11 | `courses/pressure-cleaning-all-heights/pressure-cleaning-L11.json` | `9bda06c932d11187f6894176e221820ad066b6692362e91562afb96b5aa861fa` | `6c148dc5f5201d9cd6f82841aa206bf02485869800bb791accdeacef6f4176f0` |
| 193 | pressure-cleaning-L12 | `courses/pressure-cleaning-all-heights/pressure-cleaning-L12.json` | `cbbcf2e5a53b549435ed0fe0dbad19fc931f0479f737b90952e70c041a3d7085` | `0ffce5441c25032df184a2e1e8bf639177b92a6388ae2f1777cfaa432d5c85e7` |
| 194 | property-maintenance-L02 | `courses/handyman/property-maintenance-L02.json` | `3043f013985007c75a0ef8375f3cb4690ec678c86152dd9801639bcf4e415cae` | `9dee2f78731b175cadbb150e461a19a76f9ec7a2ef820411f60d9aa20547cbbb` |
| 195 | property-maintenance-L03 | `courses/handyman/property-maintenance-L03.json` | `a03a61b23afac78b912e86509d084bd78069496c08f4ec68288c0db306082df5` | `c4a0e1d8531570d0c959e22b99e4e92ea60b1b9064cc694a5b9457e2cc63121e` |
| 196 | property-maintenance-L04 | `courses/handyman/property-maintenance-L04.json` | `5f940e88e4581f2709a4a19a082f5c7a7e2f52d2abbae3e3f7b497816044b86a` | `4048d5df6f490defcfcc36a9b7c644a54d54e1211cd72fbb5de8199603965167` |
| 197 | property-maintenance-L08 | `courses/handyman/property-maintenance-L08.json` | `2c9e06c851df566c647c19e92230ac7fb9de3aa8df7f92e70ee48205a2da93ca` | `552267c83d46aa3ebbcb580b45ef7d5736a55146d1b3edb5d81cd5b8111de4fc` |
| 198 | property-maintenance-L09 | `courses/handyman/property-maintenance-L09.json` | `016ed49aa39ae50e8d3b2b5073ce7b44ab01d860c790182f38deba31cd30a5dc` | `f7588e0843238f1385aefafce977c89d0ad3b6b3a5ed1d2bcd78ebb2dfafe99e` |
| 199 | property-maintenance-L10 | `courses/handyman/property-maintenance-L10.json` | `a31897fea3f5d8b8ae9bde30baa56c9773bc95cd85607ef130f4fd0c27550047` | `55e906d016f309dff68c45c821e6a64dce6e527e5665f7ea94058ddae48a013f` |
| 200 | property-maintenance-L11 | `courses/handyman/property-maintenance-L11.json` | `b5acc341ddfad61df2120878184daa17c4eea2416dcd245abc853660bb4c9ac9` | `75f3217e1b6aa669bbcd1dca499254e86d85bad4ccb728af2e41ec123a64e880` |
| 201 | property-maintenance-L12 | `courses/handyman/property-maintenance-L12.json` | `2ed1de2e8db756973a89aebcaf20541c44468b57c8ff8462d72c7722ddac5f00` | `5c0d88144950dec2fb3df9bc62043ddc81be4d2eb4d7da63133861505f9e2fda` |
| 202 | roof-cleaning-soft-washing-L03 | `courses/roof-soft-washing/roof-cleaning-soft-washing-L03.json` | `ea8c83660565e978a477249cbb2287c360b082d17d08e85b79f29a68a998954e` | `6ab94ac397e16e125943203299c2cae6096af4a52681ece2c5faa9e44bd697c8` |
| 203 | roof-cleaning-soft-washing-L07 | `courses/roof-soft-washing/roof-cleaning-soft-washing-L07.json` | `ff160d19fe615dc4f280cc804ba76ddb3503ab593231f0118370d71f9bbc5b4f` | `5863f92f3aef1eb0ebd428941ee49a30b02f671951530069fe9ef0b199153829` |
| 204 | roof-cleaning-soft-washing-L08 | `courses/roof-soft-washing/roof-cleaning-soft-washing-L08.json` | `5cd947b4d070d3c3c5e9edaf9c251e44fb783b7a3354a3018024bac562a38dcf` | `2407545ec893d61e69b9038fbe478bb88a9b1c801499c26ca6fb7badbc92bbe3` |
| 205 | roof-cleaning-soft-washing-L09 | `shared/exterior/roof-cleaning-soft-washing-L09.json` | `5c244caae6a60dbb75b98e0878a730c034629fbd25b40f8fd093a7f8d4b77042` | `53a0bc0ee06aae934cf7faf4a178de67c49f41927530c524c6e7d950cba0c044` |
| 206 | roof-cleaning-soft-washing-L12 | `courses/roof-soft-washing/roof-cleaning-soft-washing-L12.json` | `91f522a4029f802f5ff0f87b03f76b11d6a4f7575fdd062144dec3b467935612` | `7d1b65f1a209e9b660fc629472d9cbc652077586855518d200141b81a841f721` |
| 207 | warehouse-deep-cleaning-L04 | `courses/commercial-and-office-cleaning/warehouse-deep-cleaning-L04.json` | `4dfeffe2b222845b9c3820d9ecd5784c5266149ebb013b6af3727306a2985544` | `5529422fc9634dec68aaa04d6d0822142c430e5a0cf37772067cb80c4568ddd0` |
| 208 | warehouse-deep-cleaning-L06 | `courses/commercial-and-office-cleaning/warehouse-deep-cleaning-L06.json` | `5f46a9614fac278fcc16bbda1fcadee4040cb9d1c6e31c88311bb589d8467cdb` | `c778a373af29d54c7ee6c6129e82670e6e6446fb3610eb7101b8c6398295ac93` |
| 209 | warehouse-deep-cleaning-L10 | `shared/cleaning/warehouse-deep-cleaning-L10.json` | `b3184600aaef13e1266efa9dbd8162ea67d579c2aa26a658970f959db368a49d` | `bcef1be1e9d1b417958712e10621bb61c290d1d1206f17b39549131a8882448d` |

All 216 `readySourceSha256` values match their files.

