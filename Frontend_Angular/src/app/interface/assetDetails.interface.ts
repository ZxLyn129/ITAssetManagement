import { Asset } from "./asset.interface";
import { AssetLog } from "./assetLog.interface";

export interface AssetDetails {
    asset: Asset;
    logs: AssetLog[];
}