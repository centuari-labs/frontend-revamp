"use client";

import { CentuariAlert } from "@/components/centuari-alert";
import { CentuariCalender } from "@/components/centuari-calender";
import { CentuariChart } from "@/components/centuari-chart";
import { CentuariDialog } from "@/components/centuari-dialog";
import HealthFactor from "@/components/centuari-health-factor";
import { CentuariInput } from "@/components/centuari-input";
import { CentuariInputExample } from "@/components/centuari-input-example";
import CentuariNavbar from "@/components/centuari-navbar";
import { CentuariTable } from "@/components/centuari-table";
import { CentuariTokenCard } from "@/components/centuari-token-card";
import { CentuariTypography } from "@/components/centuari-typography";
import { IcDollarCentuari } from "@/components/icons/ic-dollar-centuari";
import { IcMailCentuari } from "@/components/icons/ic-mail-centuari";
import { SelectSingleToken } from "@/components/select-single-token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoIcon, Search, X } from "lucide-react";

const tokenList = [
  { logo: "/tokens/centuari-btc.png", value: "btc", label: "Bitcoin" },
  { logo: "/tokens/centuari-aave.png", value: "aave", label: "Aave" },
  { logo: "/tokens/centuari-eth.png", value: "eth", label: "Ethereum" },
  { logo: "/tokens/centuari-arbitrum.png", value: "arb", label: "Arbitrum" },
  { logo: "/tokens/centuari-usdc.png", value: "usdc", label: "USDC" },
  { logo: "/tokens/centuari-usdt.png", value: "usdt", label: "USDT" },
  { logo: "/tokens/centuari-dai.png", value: "dai", label: "DAI" },
  {
    logo: "/tokens/centuari-centuari.png",
    value: "centuari",
    label: "Centuari",
  },
];

export default function Sandbox() {
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
      <div className="w-full mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <CentuariTokenCard />
        <CentuariTokenCard />
        <CentuariTokenCard />
        <CentuariTokenCard />
        <div>
          <div className="space-x-2 space-y-2">
            <Button variant={"primary-dark"} disabled>
              Login To Centuari
            </Button>
            <Button variant={"primary"}>Login To Centuari</Button>
            <Button variant={"secondary"}>Login To Centuari</Button>
          </div>
          <div className="mt-2 flex gap-2">
            <Badge variant="primary">Label Text</Badge>
            <Badge variant="success">Label Text</Badge>
            <Badge variant="warning">Label Text</Badge>
            <Badge variant="error">Label Text</Badge>
            <Badge variant="danger">Label Text</Badge>
            <Badge variant="secondary">Label Text</Badge>
            <Badge variant="gray">Label Text</Badge>
          </div>
        </div>
      </div>
      <div className="mt-10 grid grid-cols-2 items-center gap-4 w-full">
        <MultiSelect
          options={tokenList}
          onValueChange={(values) => console.log(values)}
          placeholder="Select Coins"
          variant="default"
          maxCount={2}
        />
        <div>
          <Tabs defaultValue="satu" className="w-full">
            <TabsList>
              <TabsTrigger value="satu">Label Satu</TabsTrigger>
              <TabsTrigger value="dua">Label Dua</TabsTrigger>
              <TabsTrigger value="tiga">Label Tiga</TabsTrigger>
              <TabsTrigger value="empat">Label Empat</TabsTrigger>
              <TabsTrigger value="lima">Label Lima</TabsTrigger>
              <TabsTrigger value="enam">Label Enam</TabsTrigger>
            </TabsList>
            <TabsContent value="satu">Content Satu</TabsContent>
            <TabsContent value="dua">Content Dua</TabsContent>
            <TabsContent value="tiga">Content Tiga</TabsContent>
            <TabsContent value="empat">Content Empat</TabsContent>
            <TabsContent value="lima">Content Lima</TabsContent>
            <TabsContent value="enam">Content Enam</TabsContent>
          </Tabs>
          <Tabs defaultValue="satu" className="w-full">
            <TabsList className="bg-background rounded-none border-b p-0">
              <TabsTrigger
                value="satu"
                className="bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:border-muted-foreground/30 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none"
              >
                Label Satu
              </TabsTrigger>
              <TabsTrigger
                value="dua"
                className="bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:border-muted-foreground/30 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none"
              >
                Label Dua
              </TabsTrigger>
              <TabsTrigger
                value="tiga"
                className="bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:border-muted-foreground/30 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none"
              >
                Label Tiga
              </TabsTrigger>
              <TabsTrigger
                value="empat"
                className="bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:border-muted-foreground/30 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none"
              >
                Label Empat
              </TabsTrigger>
              <TabsTrigger
                value="lima"
                className="bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:border-muted-foreground/30 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none"
              >
                Label Lima
              </TabsTrigger>
              <TabsTrigger
                value="enam"
                className="bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:border-muted-foreground/30 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none"
              >
                Label Enam
              </TabsTrigger>
            </TabsList>
            <TabsContent value="satu">Content Satu</TabsContent>
            <TabsContent value="dua">Content Dua</TabsContent>
            <TabsContent value="tiga">Content Tiga</TabsContent>
            <TabsContent value="empat">Content Empat</TabsContent>
            <TabsContent value="lima">Content Lima</TabsContent>
            <TabsContent value="enam">Content Enam</TabsContent>
          </Tabs>
        </div>
      </div>
      <CentuariDialog />
      <div className="mt-10">
        <CentuariCalender />
      </div>
    </main>
  );
}
