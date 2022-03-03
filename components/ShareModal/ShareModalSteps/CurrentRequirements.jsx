// import React, { useState, useEffect } from "react";
// import LitJsSdk from "lit-js-sdk";
//
// import styles from "../share-modal.module.scss";
//
// import { Table } from "@consta/uikit/Table";
// import { IconBackward } from "@consta/uikit/IconBackward";
//
// const CurrentRequirements = ({
//   setActiveStep,
//   sharingItems,
//   tokenList,
//   requirementCreated,
//   myWalletAddress,
// }) => {
//   const [rows, setRows] = useState([]);
//   const accessControlConditions = sharingItems[0].accessControlConditions;
//
//   useEffect(() => {
//     const go = async () => {
//       const humanizedMainCondition = (
//         await LitJsSdk.humanizeAccessControlConditions({
//           accessControlConditions,
//           tokenList,
//           myWalletAddress,
//         })
//       ).join(" and ");
//       // console.log("humanized main condition", humanizedMainCondition);
//       // sharingItems[0].additionalAccessControlConditions is an array objects
//       // and each object contains an accessControlCondition array
//       let humanizedAdditionalConditions = [];
//       if (sharingItems[0].additionalAccessControlConditions) {
//         const justConditions =
//           sharingItems[0].additionalAccessControlConditions.map(
//             (a) => a.accessControlConditions
//           );
//         // console.log(
//         //   "additional access control conditions justConditions",
//         //   justConditions
//         // );
//         humanizedAdditionalConditions = await Promise.all(
//           justConditions.map(async (c) => {
//             // console.log("humanizing additional access control condition", c);
//             const humanized = await LitJsSdk.humanizeAccessControlConditions({
//               accessControlConditions: c,
//               tokenList,
//               myWalletAddress,
//             });
//             // console.log("humanized ", humanized);
//             return humanized.join(" and ");
//           })
//         );
//       }
//       // console.log(
//       //   "humanizedAdditionalConditions",
//       //   humanizedAdditionalConditions
//       // );
//
//       const regularAndAdditional = [
//         humanizedMainCondition,
//         ...humanizedAdditionalConditions,
//       ];
//       setRows(regularAndAdditional.map((h) => ({ requirement: h })));
//     };
//
//     go();
//   }, [sharingItems]);
//
//   const columns = [
//     {
//       title: "Requirement",
//       accessor: "requirement",
//       width: 600,
//     },
//     // {
//     //   title: 'Date Added',
//     //   accessor: 'date',
//     // },
//   ];
//
//   return (
//     <div>
//       {!requirementCreated ? (
//         <div
//           className={styles.back}
//           onClick={() => setActiveStep("ableToAccess")}
//         >
//           <IconBackward view="link" className={styles.icon} /> Back
//         </div>
//       ) : null}
//
//       <div className={styles.titles}>
//         <h3>Wallets that meet one of these requirements can access this</h3>
//       </div>
//       <div className={styles.table}>
//         <Table
//           borderBetweenRows
//           columns={columns}
//           rows={rows}
//           emptyRowsPlaceholder="No requirements yet."
//         />
//       </div>
//     </div>
//   );
// };
//
// export default CurrentRequirements;
