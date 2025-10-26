"use client";

import { CentuariAlert } from "@/components/centuari-alert";
import { CentuariChart } from "@/components/centuari-chart";
import HealthFactor from "@/components/centuari-health-factor";
import { CentuariInput } from "@/components/centuari-input";
import { CentuariInputExample } from "@/components/centuari-input-example";
import CentuariNavbar from "@/components/centuari-navbar";
import { CentuariTable } from "@/components/centuari-table";
import { CentuariTypography } from "@/components/centuari-typography";
import { IcDollarCentuari } from "@/components/icons/ic-dollar-centuari";
import { IcMailCentuari } from "@/components/icons/ic-mail-centuari";
import { Button } from "@/components/ui/button";
import { InfoIcon, Search, X } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <CentuariNavbar />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-10">
        <CentuariInputExample />
        <div className="grid grid-cols-3 gap-2">
          <CentuariInput
            id="search"
            label="Search Small"
            size="small"
            placeholder="Search something"
            leftIcon={<Search size={16} />}
            rightIcon={<X size={16} />}
            helperText="This is a helper text."
            disabled={true}
          />
          <CentuariInput
            id="search"
            label="Search Medium"
            size="medium"
            placeholder="Search something"
            leftIcon={<Search size={16} />}
            rightIcon={<X size={16} />}
            helperText="This is a helper text."
          />
          <CentuariInput
            id="search"
            label="Search Large"
            size="large"
            placeholder="Search something"
            leftIcon={<IcMailCentuari color="white" size={20} />}
            rightIcon={<X size={16} />}
            helperText="This is a helper text."
          />
          {/* Variant Currency */}
          <CentuariInput
            id="search"
            label="Label"
            size="small"
            placeholder="Placeholder"
            leftIcon={<IcDollarCentuari size={16} />}
            rightIcon={<X size={16} />}
            helperText="This is a helper text."
            balanceText="$1000"
          />
          <CentuariInput
            id="search"
            label="Label"
            size="medium"
            placeholder="Placeholder"
            leftIcon={<IcDollarCentuari size={16} />}
            rightIcon={
              <Button variant={"link"} className="px-0">
                Max
              </Button>
            }
            helperText="This is a helper text."
            balanceText={"1000"}
          />
          <CentuariInput
            id="search"
            label="Label"
            size="large"
            placeholder="Placeholder"
            leftIcon={<IcDollarCentuari size={16} />}
            rightIcon={
              <Button variant={"link"} className="px-0">
                Max
              </Button>
            }
            helperText="This is a helper text."
            balanceText="$1000"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-10 w-full">
        <div className="space-y-4">
          <CentuariInput
            id="search"
            label="Label"
            size="medium"
            placeholder="Placeholder"
            leftIcon={<Search size={16} />}
            rightIcon={
              <Button variant={"link"} className="px-0">
                Max
              </Button>
            }
            helperText="This is a helper text."
          />
          <CentuariInput
            id="search"
            label="Label"
            size="medium"
            placeholder="Placeholder"
            leftIcon={<Search size={16} />}
            rightIcon={
              <Button variant={"link"} className="px-0">
                Max
              </Button>
            }
            helperText="This is a helper text."
          />
          <CentuariInput
            id="search"
            label="Label"
            size="medium"
            placeholder="Placeholder"
            leftIcon={<Search size={16} />}
            rightIcon={
              <Button variant={"link"} className="px-0">
                Max
              </Button>
            }
            helperText="This is a helper text."
          />
        </div>
        <div className="space-y-2">
          <CentuariAlert
            text="Success!"
            description="Your changes have been saved."
            variant="success"
            icon={<InfoIcon />}
          />
          <CentuariAlert
            text="Warning!"
            description="Your changes have not been saved."
            variant="warning"
            icon={<InfoIcon />}
          />
          <CentuariAlert
            text="Error!"
            description="Your changes have not been saved."
            variant="destructive"
            icon={<InfoIcon />}
          />
        </div>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-2">
        <div className="grid grid-cols-5 gap-4">
          <CentuariTypography color="primary" variant="h1">
            H1
          </CentuariTypography>
          <CentuariTypography color="primary" variant="h2">
            H2
          </CentuariTypography>
          <CentuariTypography color="primary" variant="h3">
            H3
          </CentuariTypography>
          <CentuariTypography color="primary" variant="h4">
            H4
          </CentuariTypography>
          <CentuariTypography color="primary" variant="h5">
            H5
          </CentuariTypography>
          <CentuariTypography color="primary" variant="h6">
            H6
          </CentuariTypography>
          <CentuariTypography color="primary" variant="s1">
            S1
          </CentuariTypography>
          <CentuariTypography color="primary" variant="s2">
            S2
          </CentuariTypography>
          <CentuariTypography color="primary" variant="s3">
            S3
          </CentuariTypography>
          <CentuariTypography color="primary" variant="s4">
            S4
          </CentuariTypography>
          <CentuariTypography color="primary" variant="j1">
            J1
          </CentuariTypography>
          <CentuariTypography color="primary" variant="j2">
            J2
          </CentuariTypography>
          <CentuariTypography color="primary" variant="b1">
            B1
          </CentuariTypography>
          <CentuariTypography color="primary" variant="b2">
            B2
          </CentuariTypography>
          <CentuariTypography color="primary" variant="b3">
            B3
          </CentuariTypography>
          <CentuariTypography color="primary" variant="l1">
            L1
          </CentuariTypography>
          <CentuariTypography color="primary" variant="l1">
            L1
          </CentuariTypography>
          <CentuariTypography color="primary" variant="c1">
            C1
          </CentuariTypography>
          <CentuariTypography color="primary" variant="c2">
            C2
          </CentuariTypography>
        </div>
        <div>
          <HealthFactor />
        </div>
      </div>
      <div className="w-full mt-10 grid-cols-2 gap-2 grid">
        <CentuariChart />
        <div className="flex justify-center items-center gap-4">
          <IcDollarCentuari color="white" size={30} />
          <IcMailCentuari color="white" size={30} />
        </div>
      </div>
      <div className="w-full mt-5">
        <CentuariTable />
      </div>
    </main>
  );
}
