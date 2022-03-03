// import React, { useState } from "react";
//
// import styles from "../share-modal.module.scss";
//
// import { Table } from "@consta/uikit/Table";
// import { IconBackward } from "@consta/uikit/IconBackward";
//
// const RecentRequirement = ({ setActiveStep }) => {
//   const columns = [
//     {
//       title: "Requirement",
//       accessor: "requiment",
//       width: 600,
//     },
//     {
//       title: "Date Added",
//       accessor: "date",
//     },
//   ];
//
//   const rows = [
//     {
//       date: "01/01/2021",
//       requiment: "Owns at least 2 CrpytoPunk",
//     },
//     {
//       date: "01/01/2021",
//       requiment: "Owners Sneider.eth",
//     },
//     {
//       date: "01/01/2021",
//       requiment: "Is a Member of CityDAO",
//     },
//   ];
//
//   return (
//     <div>
//       <div
//         className={styles.back}
//         onClick={() => setActiveStep("ableToAccess")}
//       >
//         <IconBackward view="link" className={styles.icon} /> Back
//       </div>
//       <div className={styles.titles}>
//         <h3>Wallets that Meet One of These Requiments can Access this</h3>
//       </div>
//       <div className={styles.table}>
//         <Table
//           borderBetweenRows
//           columns={columns}
//           rows={rows}
//           emptyRowsPlaceholder="No requiments yet."
//         />
//       </div>
//     </div>
//   );
// };
//
// export default RecentRequirement;
