"use client";

import { createContext } from "react";

export const AppCtx = createContext({
  studioName:"", studioSlug:"", userName:"", userEmail:"",
  planName:"", membersCount:0, userRole:"",
  discs:[], setDiscs:()=>{},
  studioId:null, setStudioId:()=>{}
});
