"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { User, Lock, Mail, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { CentuariInput } from "./centuari-input";

const formSchema = z.object({
	username: z
		.string()
		.min(2, {
			message: "Username must be at least 2 characters.",
		})
		.max(50, {
			message: "Username must not be longer than 50 characters.",
		}),
	email: z.string().email({
		message: "Please enter a valid email address.",
	}),
	password: z.string().min(8, {
		message: "Password must be at least 8 characters.",
	}),
	amount: z.string().refine((val) => !Number.isNaN(parseInt(val, 10)), {
		message: "Expected number, received a string",
	}),
});

export function CentuariInputExample() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: "",
			email: "",
			password: "",
			amount: "",
		},
	});

	function onSubmit(_values: z.infer<typeof formSchema>) {
		// Example form — submission handled by the consuming component.
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<CentuariInput
									id="username"
									label="Username"
									placeholder="Enter your username"
									leftIcon={<User size={16} />}
									size="small"
									{...field}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<CentuariInput
									id="email"
									type="email"
									placeholder="Enter your email"
									leftIcon={<Mail size={16} />}
									size="medium"
									{...field}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<CentuariInput
									id="password"
									type="password"
									label="Password"
									placeholder="Enter your password"
									leftIcon={<Lock size={16} />}
									rightIcon={<Lock size={16} />}
									size="medium"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="amount"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<CentuariInput
									id="amount"
									type="number"
									label="Amount"
									placeholder="0.00"
									variant="currency"
									leftIcon={<DollarSign size={16} />}
									rightIcon={<DollarSign size={16} />}
									size="large"
									balanceText="Balance: $1,234.56"
									{...field}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				<Button type="submit">Submit</Button>
			</form>
		</Form>
	);
}
